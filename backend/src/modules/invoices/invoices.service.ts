import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { Invoice } from '../../generated/prisma/client';
import { ChangeInvoiceStatusDto } from './dto/change-invoice-status.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

/**
 * Facturación y cobro. Aislada por ownerId. Toda factura nace de un proyecto,
 * que se valida vía ProjectsService. El número es único por cuenta y, si no se
 * indica, se genera automáticamente.
 */
@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  async create(ownerId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    await this.projects.assertOwned(ownerId, dto.projectId);
    const base = {
      ownerId,
      projectId: dto.projectId,
      currency: dto.currency ?? 'USD',
      total: dto.total ?? 0,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    };

    // Número manual: respeta la unicidad por cuenta.
    if (dto.number) {
      try {
        return await this.prisma.invoice.create({
          data: { ...base, number: dto.number },
        });
      } catch (e) {
        if (this.isUniqueError(e)) {
          throw new ConflictException('Ya existe una factura con ese número');
        }
        throw e;
      }
    }

    // Número automático con reintentos ante carreras de concurrencia.
    for (let attempt = 0; attempt < 5; attempt++) {
      const number = await this.nextNumber(ownerId, attempt);
      try {
        return await this.prisma.invoice.create({ data: { ...base, number } });
      } catch (e) {
        if (this.isUniqueError(e)) continue;
        throw e;
      }
    }
    throw new ConflictException('No se pudo generar el número de factura');
  }

  findAll(ownerId: string, query: QueryInvoicesDto): Promise<Invoice[]> {
    const { status, projectId, search } = query;
    return this.prisma.invoice.findMany({
      where: {
        ownerId,
        ...(status ? { status } : {}),
        ...(projectId ? { projectId } : {}),
        ...(search
          ? { number: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Detalle de la factura: proyecto, pagos y totales (pagado/saldo). */
  async findOne(ownerId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, ownerId },
      include: {
        project: true,
        payments: { orderBy: { paidAt: 'asc' } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }
    return this.withTotals(invoice);
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    await this.assertOwned(ownerId, id);
    try {
      return await this.prisma.invoice.update({
        where: { id },
        data: {
          ...(dto.number !== undefined ? { number: dto.number } : {}),
          ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
          ...(dto.total !== undefined ? { total: dto.total } : {}),
          ...(dto.dueDate !== undefined
            ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
            : {}),
        },
      });
    } catch (e) {
      if (this.isUniqueError(e)) {
        throw new ConflictException('Ya existe una factura con ese número');
      }
      throw e;
    }
  }

  /** Cambia el estado de cobro. Al EMITIR por primera vez fija issuedAt. */
  async changeStatus(
    ownerId: string,
    id: string,
    dto: ChangeInvoiceStatusDto,
  ): Promise<Invoice> {
    const current = await this.prisma.invoice.findFirst({
      where: { id, ownerId },
      select: { issuedAt: true },
    });
    if (!current) {
      throw new NotFoundException('Factura no encontrada');
    }
    const markIssued = dto.status === 'ISSUED' && !current.issuedAt;
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: dto.status,
        ...(markIssued ? { issuedAt: new Date() } : {}),
      },
    });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.assertOwned(ownerId, id);
    // Los pagos se borran en cascada (onDelete: Cascade).
    await this.prisma.invoice.delete({ where: { id } });
  }

  // ───────────────────────────── pagos ─────────────────────────────

  /**
   * Registra un pago. Si los pagos cubren el total, marca la factura PAID.
   */
  async addPayment(ownerId: string, id: string, dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, ownerId },
      select: { id: true, total: true, status: true },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    await this.prisma.payment.create({
      data: {
        invoiceId: id,
        amount: dto.amount,
        method: dto.method ?? null,
        ...(dto.paidAt ? { paidAt: new Date(dto.paidAt) } : {}),
      },
    });

    const paid = await this.totalPaid(id);
    const total = Number(invoice.total);
    if (total > 0 && paid >= total && invoice.status !== 'PAID') {
      await this.prisma.invoice.update({
        where: { id },
        data: { status: 'PAID' },
      });
    }
    return this.findOne(ownerId, id);
  }

  /**
   * Elimina un pago. Si la factura estaba PAID y deja de estar cubierta,
   * vuelve a ISSUED.
   */
  async removePayment(ownerId: string, id: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, invoiceId: id, invoice: { ownerId } },
      select: { id: true },
    });
    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }
    await this.prisma.payment.delete({ where: { id: paymentId } });

    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      select: { total: true, status: true },
    });
    const paid = await this.totalPaid(id);
    if (invoice.status === 'PAID' && paid < Number(invoice.total)) {
      await this.prisma.invoice.update({
        where: { id },
        data: { status: 'ISSUED' },
      });
    }
    return this.findOne(ownerId, id);
  }

  // ───────────────────────────── helpers ─────────────────────────────

  /** Genera INV-0001, INV-0002… a partir del número de facturas de la cuenta. */
  private async nextNumber(ownerId: string, offset: number): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { ownerId } });
    return `INV-${String(count + 1 + offset).padStart(4, '0')}`;
  }

  private async totalPaid(invoiceId: string): Promise<number> {
    const agg = await this.prisma.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount ?? 0);
  }

  /** Añade los importes calculados pagado/saldo al detalle. */
  private withTotals<T extends { total: unknown; payments: { amount: unknown }[] }>(
    invoice: T,
  ) {
    const amountPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const total = Number(invoice.total);
    return {
      ...invoice,
      amountPaid: Math.round(amountPaid * 100) / 100,
      balance: Math.round((total - amountPaid) * 100) / 100,
    };
  }

  private async assertOwned(ownerId: string, id: string): Promise<void> {
    const found = await this.prisma.invoice.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Factura no encontrada');
    }
  }

  private isUniqueError(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: string }).code === 'P2002'
    );
  }
}
