import PDFDocument from 'pdfkit';

import { CompanyProfile } from '../../generated/prisma/client';

/** Datos mínimos que necesita el PDF (forma del detalle de InvoicesService). */
export interface InvoicePdfData {
  number: string;
  status: string;
  currency: string;
  total: unknown;
  issuedAt?: Date | null;
  dueDate?: Date | null;
  createdAt: Date;
  project?: { name: string } | null;
  payments: { amount: unknown; paidAt: Date; method?: string | null }[];
  amountPaid: number;
  balance: number;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitida',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
};

const dateFmt = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function money(value: unknown, currency: string): string {
  const n = Number(value);
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

/**
 * Construye el PDF de una factura con los datos de la cuenta (CompanyProfile).
 * Devuelve el binario completo en memoria; las facturas son de una página.
 */
export function buildInvoicePdf(
  invoice: InvoicePdfData,
  profile: CompanyProfile | null,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = 50;
    const right = 545;

    // ── Cabecera: emisor ─────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#111827')
      .text(profile?.businessName ?? 'Mi negocio', left, 50);

    doc.font('Helvetica').fontSize(9).fillColor('#6B7280');
    const issuerLines = [
      profile?.taxId ? `NIF/RFC: ${profile.taxId}` : null,
      profile?.address ?? null,
      [profile?.email, profile?.phone].filter(Boolean).join(' · ') || null,
    ].filter((l): l is string => l !== null);
    for (const line of issuerLines) {
      doc.text(line);
    }

    // ── Título y número ──────────────────────────────────────────────
    doc.moveDown(2);
    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor('#111827')
      .text(`Factura ${invoice.number}`, left);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#6B7280')
      .text(`Estado: ${STATUS_LABEL[invoice.status] ?? invoice.status}`);

    // ── Fechas y proyecto ────────────────────────────────────────────
    doc.moveDown(1);
    const meta: [string, string][] = [
      [
        'Fecha de emisión',
        invoice.issuedAt ? dateFmt.format(invoice.issuedAt) : '—',
      ],
      [
        'Fecha de vencimiento',
        invoice.dueDate ? dateFmt.format(invoice.dueDate) : '—',
      ],
      ['Proyecto', invoice.project?.name ?? '—'],
    ];
    for (const [label, value] of meta) {
      const y = doc.y;
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#6B7280')
        .text(label, left, y);
      doc.font('Helvetica-Bold').fillColor('#111827').text(value, 220, y);
      doc.moveDown(0.4);
    }

    // ── Importes ─────────────────────────────────────────────────────
    doc.moveDown(1.5);
    const lineY = doc.y;
    doc
      .moveTo(left, lineY)
      .lineTo(right, lineY)
      .strokeColor('#E5E7EB')
      .stroke();
    doc.moveDown(0.8);

    const amounts: [string, string, boolean][] = [
      ['Total', money(invoice.total, invoice.currency), true],
      ['Pagado', money(invoice.amountPaid, invoice.currency), false],
      ['Saldo pendiente', money(invoice.balance, invoice.currency), true],
    ];
    for (const [label, value, bold] of amounts) {
      const y = doc.y;
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(12)
        .fillColor('#111827')
        .text(label, left, y);
      doc.text(value, left, y, { width: right - left, align: 'right' });
      doc.moveDown(0.5);
    }

    // ── Pagos registrados ────────────────────────────────────────────
    if (invoice.payments.length > 0) {
      doc.moveDown(1.5);
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#111827')
        .text('Pagos registrados', left);
      doc.moveDown(0.4);
      for (const payment of invoice.payments) {
        const y = doc.y;
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#6B7280')
          .text(dateFmt.format(payment.paidAt), left, y);
        doc.text(payment.method ?? '—', 220, y);
        doc
          .fillColor('#111827')
          .text(money(payment.amount, invoice.currency), left, y, {
            width: right - left,
            align: 'right',
          });
        doc.moveDown(0.3);
      }
    }

    // ── Pie ──────────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#9CA3AF')
      .text(
        `Generada el ${dateFmt.format(new Date())} · CRM Freelance`,
        left,
        770,
        { width: right - left, align: 'center' },
      );

    doc.end();
  });
}
