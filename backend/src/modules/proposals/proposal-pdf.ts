import PDFDocument from 'pdfkit';

import { CompanyProfile } from '../../generated/prisma/client';

/** Ítem de la propuesta tal como llega del detalle (Decimal → unknown). */
export interface ProposalPdfItem {
  description: string;
  quantity: unknown;
  unitPrice: unknown;
}

/** Datos que necesita el PDF (forma del detalle de ProposalsService). */
export interface ProposalPdfData {
  title: string;
  status: string;
  currency: string;
  total: unknown;
  notes?: string | null;
  sentAt?: Date | null;
  createdAt: Date;
  contact?: { firstName: string; lastName?: string | null } | null;
  deal?: { title: string } | null;
  items: ProposalPdfItem[];
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
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

function qty(value: unknown): string {
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Construye el PDF de una propuesta: emisor, ítems (descripción, cantidad,
 * precio, subtotal) y total. Devuelve el binario completo en memoria.
 */
export function buildProposalPdf(
  proposal: ProposalPdfData,
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
    // Columnas de la tabla de ítems.
    const colQty = 330;
    const colPrice = 400;
    const colSubtotal = right;

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

    // ── Título ───────────────────────────────────────────────────────
    doc.moveDown(2);
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#111827')
      .text('Propuesta', left);
    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#374151')
      .text(proposal.title, left);

    // ── Metadatos ────────────────────────────────────────────────────
    doc.moveDown(0.8);
    const contactName = proposal.contact
      ? [proposal.contact.firstName, proposal.contact.lastName]
          .filter(Boolean)
          .join(' ')
      : proposal.deal?.title;
    const meta: [string, string][] = [
      ['Estado', STATUS_LABEL[proposal.status] ?? proposal.status],
      ['Fecha', dateFmt.format(proposal.sentAt ?? proposal.createdAt)],
      ['Para', contactName ?? '—'],
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

    // ── Tabla de ítems: cabecera ─────────────────────────────────────
    doc.moveDown(1);
    const headY = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#6B7280');
    doc.text('Descripción', left, headY);
    doc.text('Cant.', colQty, headY, { width: 60, align: 'right' });
    doc.text('Precio', colPrice, headY, { width: 70, align: 'right' });
    doc.text('Subtotal', colPrice, headY, {
      width: colSubtotal - colPrice,
      align: 'right',
    });
    doc.moveDown(0.5);
    doc
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .strokeColor('#E5E7EB')
      .stroke();
    doc.moveDown(0.5);

    // ── Tabla de ítems: filas ────────────────────────────────────────
    for (const item of proposal.items) {
      if (doc.y > 720) doc.addPage();
      const y = doc.y;
      const subtotal = Number(item.quantity) * Number(item.unitPrice);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#111827')
        .text(item.description, left, y, { width: colQty - left - 10 });
      const rowBottom = doc.y;
      doc.fillColor('#374151');
      doc.text(qty(item.quantity), colQty, y, { width: 60, align: 'right' });
      doc.text(money(item.unitPrice, proposal.currency), colPrice, y, {
        width: 70,
        align: 'right',
      });
      doc.text(money(subtotal, proposal.currency), colPrice, y, {
        width: colSubtotal - colPrice,
        align: 'right',
      });
      // Respeta descripciones de varias líneas.
      doc.y = Math.max(rowBottom, y + 14);
      doc.moveDown(0.2);
    }

    // ── Total ────────────────────────────────────────────────────────
    doc.moveDown(0.5);
    doc
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .strokeColor('#E5E7EB')
      .stroke();
    doc.moveDown(0.6);
    const totalY = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#111827')
      .text('Total', left, totalY);
    doc.text(money(proposal.total, proposal.currency), left, totalY, {
      width: right - left,
      align: 'right',
    });

    // ── Notas ────────────────────────────────────────────────────────
    if (proposal.notes) {
      doc.moveDown(2);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#6B7280')
        .text('Notas', left);
      doc.moveDown(0.3);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#374151')
        .text(proposal.notes, left, doc.y, { width: right - left });
    }

    doc.end();
  });
}
