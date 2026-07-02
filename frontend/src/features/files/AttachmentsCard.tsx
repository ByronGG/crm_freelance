import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Paperclip, Plus, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { fieldInputClass } from '../../components/ui/TextField'
import { formatDate } from '../../lib/format'
import { createAttachment, deleteAttachment, listAttachments } from './api'
import type { AttachableType } from './types'

interface Props {
  entityType: AttachableType
  entityId: string
}

/**
 * Adjuntos de una entidad: lista de referencias (nombre + URL) con alta y
 * borrado. El binario vive en su URL (Drive, Dropbox…); aquí la referencia.
 */
export function AttachmentsCard({ entityType, entityId }: Props) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [filename, setFilename] = useState('')
  const [url, setUrl] = useState('')

  const key = ['attachments', entityType, entityId]

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => listAttachments(entityType, entityId),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: key })
  }

  const add = useMutation({
    mutationFn: () => createAttachment(entityType, entityId, { filename, url }),
    onSuccess: () => {
      setFilename('')
      setUrl('')
      setAdding(false)
      invalidate()
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteAttachment(id),
    onSuccess: invalidate,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!filename.trim() || !/^https?:\/\//i.test(url.trim())) return
    add.mutate()
  }

  const attachments = data ?? []
  const validUrl = /^https?:\/\//i.test(url.trim())

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-fg">
          <Paperclip size={15} className="text-subtle" />
          Adjuntos
        </span>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-fg hover:underline"
        >
          <Plus size={13} /> Añadir
        </button>
      </div>

      {adding && (
        <form onSubmit={onSubmit} className="space-y-2 border-b border-line p-3">
          <input
            autoFocus
            className={`${fieldInputClass} h-8 text-xs`}
            placeholder="Nombre del archivo (p. ej. contrato.pdf)"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
          <input
            className={`${fieldInputClass} h-8 text-xs`}
            placeholder="https://… (Drive, Dropbox, etc.)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {url.trim() && !validUrl && (
            <p className="text-xs text-red-600 dark:text-red-400">
              La URL debe empezar por http:// o https://
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!filename.trim() || !validUrl || add.isPending}
            >
              {add.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      )}

      <div className="p-2">
        {isLoading && <p className="px-2 py-3 text-sm text-muted">Cargando…</p>}
        {isError && (
          <p className="px-2 py-3 text-sm text-red-600 dark:text-red-400">
            No se pudieron cargar los adjuntos.
          </p>
        )}
        {!isLoading && !isError && attachments.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted">Sin adjuntos.</p>
        )}

        {attachments.map((a) => (
          <div
            key={a.id}
            className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-app/60"
          >
            <Paperclip size={14} className="shrink-0 text-subtle" />
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 flex-1 items-center gap-1 text-sm text-fg hover:text-brand-fg hover:underline"
            >
              <span className="truncate">{a.filename}</span>
              <ExternalLink size={12} className="shrink-0 text-subtle" />
            </a>
            <span className="shrink-0 text-xs text-subtle">
              {formatDate(a.createdAt)}
            </span>
            <button
              type="button"
              onClick={() => remove.mutate(a.id)}
              aria-label={`Eliminar adjunto ${a.filename}`}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted opacity-0 transition-colors hover:bg-app hover:text-red-600 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
