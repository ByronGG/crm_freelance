import 'dotenv/config';

import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

// Cuenta demo. Cambia estos valores si quieres otras credenciales.
const DEMO_EMAIL = 'demo@crm.test';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Cuenta Demo';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'],
});
const prisma = new PrismaClient({ adapter });

/** Fecha desplazada `days` días respecto a hoy (negativo = pasado). */
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main(): Promise<void> {
  // Idempotente: si la cuenta demo existe, se borra en cascada y se recrea.
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash },
  });
  const ownerId = user.id;

  // Perfil de empresa (encabeza los PDF).
  await prisma.companyProfile.create({
    data: {
      ownerId,
      businessName: 'Estudio Demo S.L.',
      taxId: 'B-12345678',
      email: 'hola@estudiodemo.test',
      phone: '+34 600 123 456',
      address: 'Calle Falsa 123, Madrid',
    },
  });

  // Empresas y contactos.
  const acme = await prisma.company.create({
    data: { ownerId, name: 'Acme Inc', industry: 'Retail' },
  });
  const globex = await prisma.company.create({
    data: { ownerId, name: 'Globex', industry: 'Software' },
  });

  const ana = await prisma.contact.create({
    data: {
      ownerId,
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@acme.test',
      phone: '+34 611 111 111',
      position: 'CTO',
      companyId: acme.id,
    },
  });
  const luis = await prisma.contact.create({
    data: {
      ownerId,
      firstName: 'Luis',
      lastName: 'Pérez',
      email: 'luis@globex.test',
      position: 'CEO',
      companyId: globex.id,
    },
  });
  await prisma.contact.create({
    data: { ownerId, firstName: 'María', lastName: 'Ruiz', companyId: acme.id },
  });

  // Etiquetas aplicadas a contactos.
  const vip = await prisma.tag.create({
    data: { ownerId, name: 'VIP', color: '#0EA372' },
  });
  await prisma.tag.create({
    data: { ownerId, name: 'Frío', color: '#378ADD' },
  });
  await prisma.taggable.create({
    data: { tagId: vip.id, entityType: 'CONTACT', entityId: ana.id },
  });

  // Oportunidades con historial de etapas.
  const wonDeal = await prisma.deal.create({
    data: {
      ownerId,
      title: 'Rediseño web Acme',
      value: 12000,
      stage: 'WON',
      contactId: ana.id,
      stageHistory: {
        create: [
          { fromStage: null, toStage: 'NEW', changedAt: daysFromNow(-30) },
          { fromStage: 'NEW', toStage: 'PROPOSAL', changedAt: daysFromNow(-20) },
          { fromStage: 'PROPOSAL', toStage: 'WON', changedAt: daysFromNow(-10) },
        ],
      },
    },
  });
  await prisma.deal.create({
    data: {
      ownerId,
      title: 'App móvil Globex',
      value: 25000,
      stage: 'NEGOTIATION',
      contactId: luis.id,
      expectedClose: daysFromNow(20),
      stageHistory: {
        create: [
          { fromStage: null, toStage: 'NEW', changedAt: daysFromNow(-15) },
          {
            fromStage: 'NEW',
            toStage: 'NEGOTIATION',
            changedAt: daysFromNow(-5),
          },
        ],
      },
    },
  });
  await prisma.deal.create({
    data: {
      ownerId,
      title: 'Mantenimiento anual',
      value: 6000,
      stage: 'NEW',
      contactId: ana.id,
      stageHistory: { create: { fromStage: null, toStage: 'NEW' } },
    },
  });

  // Propuestas (una enviada hace tiempo → dispara el aviso de seguimiento).
  await prisma.proposal.create({
    data: {
      ownerId,
      title: 'Propuesta rediseño web',
      status: 'ACCEPTED',
      currency: 'EUR',
      total: 12000,
      contactId: ana.id,
      dealId: wonDeal.id,
      sentAt: daysFromNow(-18),
      items: {
        create: [
          { description: 'Diseño UI/UX', quantity: 1, unitPrice: 4000 },
          { description: 'Desarrollo frontend', quantity: 1, unitPrice: 8000 },
        ],
      },
    },
  });
  await prisma.proposal.create({
    data: {
      ownerId,
      title: 'Propuesta app móvil',
      status: 'SENT',
      currency: 'EUR',
      total: 25000,
      contactId: luis.id,
      sentAt: daysFromNow(-10),
      items: {
        create: [
          { description: 'Análisis y diseño', quantity: 1, unitPrice: 5000 },
          { description: 'Desarrollo iOS + Android', quantity: 2, unitPrice: 10000 },
        ],
      },
    },
  });

  // Proyecto derivado de la oportunidad ganada, con hitos.
  const project = await prisma.project.create({
    data: {
      ownerId,
      name: 'Rediseño web Acme',
      description: 'Nuevo sitio corporativo.',
      status: 'ACTIVE',
      startDate: daysFromNow(-8),
      dealId: wonDeal.id,
      milestones: {
        create: [
          { title: 'Wireframes', status: 'DONE', dueDate: daysFromNow(-3) },
          { title: 'Maquetación', status: 'IN_PROGRESS', dueDate: daysFromNow(7) },
          { title: 'Lanzamiento', status: 'PENDING', dueDate: daysFromNow(21) },
        ],
      },
    },
  });

  // Facturas: una pagada (con pago) y una emitida vencida (dispara aviso).
  const paid = await prisma.invoice.create({
    data: {
      ownerId,
      projectId: project.id,
      number: 'INV-0001',
      status: 'PAID',
      currency: 'EUR',
      total: 6000,
      issuedAt: daysFromNow(-15),
      dueDate: daysFromNow(-1),
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: paid.id,
      amount: 6000,
      method: 'Transferencia',
      paidAt: daysFromNow(-2),
    },
  });
  await prisma.invoice.create({
    data: {
      ownerId,
      projectId: project.id,
      number: 'INV-0002',
      status: 'ISSUED',
      currency: 'EUR',
      total: 6000,
      issuedAt: daysFromNow(-12),
      dueDate: daysFromNow(-5),
    },
  });

  // Tareas (una vencida, una para hoy) y actividad en un contacto.
  await prisma.task.create({
    data: {
      ownerId,
      title: 'Llamar a Ana para cierre',
      status: 'PENDING',
      dueDate: daysFromNow(-1),
      contactId: ana.id,
    },
  });
  await prisma.task.create({
    data: {
      ownerId,
      title: 'Enviar contrato a Globex',
      status: 'PENDING',
      dueDate: daysFromNow(0),
      dealId: wonDeal.id,
    },
  });
  await prisma.activity.createMany({
    data: [
      {
        ownerId,
        type: 'CALL',
        content: 'Llamada inicial, muy interesada.',
        contactId: ana.id,
      },
      {
        ownerId,
        type: 'EMAIL',
        content: 'Enviada propuesta por correo.',
        contactId: ana.id,
      },
    ],
  });

  console.log('Seed completado.');
  console.log(`Usuario demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
