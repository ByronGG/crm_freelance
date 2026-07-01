import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  FileText,
  Mail,
  Pencil,
  Phone,
  Target,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { formatAmount, formatMoney } from '../../lib/format'
import { ActivityTimeline } from '../activities/ActivityTimeline'
import { listDealsByContact } from '../deals/api'
import type { DealStage } from '../deals/types'
import { listProposals } from '../proposals/api'
import type { ProposalStatus } from '../proposals/types'
import { listProjects } from '../projects/api'
import type { ProjectStatus } from '../projects/types'
import { ContactFormModal } from './ContactFormModal'
import { getContact } from './api'
import type { Contact } from './types'

const DEAL_STAGE: Record<DealStage, { label: string; className: string }> = {
  NEW: { label: 'Nuevo', className: 'bg-app text-muted' },
  CONTACTED: {
    label: 'Contactado',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  PROPOSAL: {
    label: 'Propuesta',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  NEGOTIATION: {
    label: 'Negociación',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  WON: { label: 'Ganado', className: 'bg-brand-soft text-brand-fg' },
  LOST: {
    label: 'Perdido',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

const PROPOSAL_STATUS: Record<ProposalStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Borrador', className: 'bg-app text-muted' },
  SENT: {
    label: 'Enviada',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  ACCEPTED: { label: 'Aceptada', className: 'bg-brand-soft text-brand-fg' },
  REJECTED: {
    label: 'Rechazada',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

const PROJECT_STATUS: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-brand-soft text-brand-fg' },
  PAUSED: {
    label: 'En pausa',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  COMPLETED: {
    label: 'Completado',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  CANCELLED: { label: 'Cancelado', className: 'bg-app text-muted' },
}

function fullName(c: Contact): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ')
}

function initials(c: Contact): string {
  return [c.firstName?.[0], c.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase()
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

export function ContactDetailPage() {
  const { id = '' } = useParams()
  const [editOpen, setEditOpen] = useState(false)

  const contactQuery = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id),
    enabled: !!id,
  })

  const deals = useQuery({
    queryKey: ['deals', 'contact', id],
    queryFn: () => listDealsByContact(id),
    enabled: !!id,
  })

  const proposals = useQuery({
    queryKey: ['proposals', 'contact', id],
    queryFn: () => listProposals({ contactId: id }),
    enabled: !!id,
  })

  const projects = useQuery({
    queryKey: ['projects', 'contact', id],
    queryFn: () => listProjects({ contactId: id }),
    enabled: !!id,
  })

  if (contactQuery.isLoading) {
    return <p className="text-sm text-muted">Cargando contacto…</p>
  }

  if (contactQuery.isError || !contactQuery.data) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft size={16} /> Contactos
        </Link>
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-10 text-center text-sm text-red-600 dark:text-red-400">
          No se pudo cargar el contacto.
        </p>
      </div>
    )
  }

  const contact = contactQuery.data

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft size={16} /> Contactos
      </Link>

      {/* Cabecera: identidad del contacto */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-soft text-lg font-medium text-brand-fg">
            {initials(contact) || '?'}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-medium text-fg">{fullName(contact)}</h1>
            {contact.position && (
              <p className="mt-0.5 text-sm text-muted">{contact.position}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {contact.company?.name && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} className="text-subtle" />
                  {contact.company.name}
                </span>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-fg"
                >
                  <Mail size={14} className="text-subtle" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} className="text-subtle" />
                  {contact.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil size={16} /> Editar
        </Button>
      </div>

      {contact.notes && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-subtle">
            Notas
          </h2>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">
            {contact.notes}
          </p>
        </div>
      )}

      {/* Cuerpo: timeline + entidades relacionadas */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityTimeline contactId={contact.id} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <RelatedCard
            icon={Target}
            title="Oportunidades"
            count={deals.data?.length}
            empty="Sin oportunidades."
            loading={deals.isLoading}
          >
            {deals.data?.map((d) => (
              <Row
                key={d.id}
                title={d.title}
                meta={formatMoney(d.value)}
                badge={
                  <Badge
                    label={DEAL_STAGE[d.stage].label}
                    className={DEAL_STAGE[d.stage].className}
                  />
                }
              />
            ))}
          </RelatedCard>

          <RelatedCard
            icon={FileText}
            title="Propuestas"
            count={proposals.data?.length}
            empty="Sin propuestas."
            loading={proposals.isLoading}
          >
            {proposals.data?.map((p) => (
              <Row
                key={p.id}
                title={p.title}
                meta={formatAmount(p.total, p.currency)}
                badge={
                  <Badge
                    label={PROPOSAL_STATUS[p.status].label}
                    className={PROPOSAL_STATUS[p.status].className}
                  />
                }
              />
            ))}
          </RelatedCard>

          <RelatedCard
            icon={Briefcase}
            title="Proyectos"
            count={projects.data?.length}
            empty="Sin proyectos."
            loading={projects.isLoading}
          >
            {projects.data?.map((p) => (
              <Row
                key={p.id}
                title={p.name}
                badge={
                  <Badge
                    label={PROJECT_STATUS[p.status].label}
                    className={PROJECT_STATUS[p.status].className}
                  />
                }
              />
            ))}
          </RelatedCard>
        </div>
      </div>

      <ContactFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        contact={contact}
      />
    </div>
  )
}

interface RelatedCardProps {
  icon: LucideIcon
  title: string
  count?: number
  empty: string
  loading: boolean
  children: ReactNode
}

function RelatedCard({
  icon: Icon,
  title,
  count,
  empty,
  loading,
  children,
}: RelatedCardProps) {
  const isEmpty = !loading && (count ?? 0) === 0
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-fg">
          <Icon size={15} className="text-subtle" />
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-xs text-subtle">{count}</span>
        )}
      </div>
      <div className="p-2">
        {loading && (
          <p className="px-2 py-3 text-sm text-muted">Cargando…</p>
        )}
        {isEmpty && <p className="px-2 py-3 text-sm text-muted">{empty}</p>}
        {!loading && !isEmpty && children}
      </div>
    </div>
  )
}

function Row({
  title,
  meta,
  badge,
}: {
  title: string
  meta?: string
  badge: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-app/60">
      <div className="min-w-0">
        <p className="truncate text-sm text-fg">{title}</p>
        {meta && <p className="text-xs text-subtle">{meta}</p>}
      </div>
      {badge}
    </div>
  )
}
