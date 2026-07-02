import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag as TagIcon, Trash2 } from 'lucide-react'

import { fieldInputClass } from '../../components/ui/TextField'
import { TagChip } from './TagChip'
import {
  applyTag,
  createTag,
  deleteTag,
  listTags,
  listTagsForEntity,
  unapplyTag,
} from './api'
import type { TaggableType } from './types'

// Paleta compacta para elegir el color al crear una etiqueta.
const PALETTE = [
  '#0EA372',
  '#378ADD',
  '#7F77DD',
  '#EF9F27',
  '#E24B4A',
  '#D9548C',
  '#9CA3AF',
]

interface Props {
  entityType: TaggableType
  entityId: string
}

/** Etiquetas de una entidad: chips + popover para asignar, crear o borrar. */
export function TagPicker({ entityType, entityId }: Props) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PALETTE[0])

  const entityKey = ['tags', 'entity', entityType, entityId]

  const applied = useQuery({
    queryKey: entityKey,
    queryFn: () => listTagsForEntity(entityType, entityId),
  })

  const all = useQuery({
    queryKey: ['tags'],
    queryFn: listTags,
    enabled: open,
  })

  function invalidate() {
    // Refresca la entidad, el catálogo y los chips de los listados.
    queryClient.invalidateQueries({ queryKey: ['tags'] })
  }

  const apply = useMutation({
    mutationFn: (tagId: string) => applyTag(tagId, entityType, entityId),
    onSuccess: invalidate,
  })
  const unapply = useMutation({
    mutationFn: (tagId: string) => unapplyTag(tagId, entityType, entityId),
    onSuccess: invalidate,
  })
  const createAndApply = useMutation({
    mutationFn: async () => {
      const tag = await createTag(name, color)
      await applyTag(tag.id, entityType, entityId)
    },
    onSuccess: () => {
      setName('')
      invalidate()
    },
  })
  const removeTag = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: invalidate,
  })

  const appliedTags = applied.data ?? []
  const appliedIds = new Set(appliedTags.map((t) => t.id))
  const available = (all.data ?? []).filter((t) => !appliedIds.has(t.id))

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {appliedTags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            onRemove={() => unapply.mutate(tag.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-2 py-0.5 text-xs text-muted transition-colors hover:border-brand-500 hover:text-brand-fg"
        >
          <TagIcon size={11} /> Etiqueta
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar etiquetas"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-line bg-surface p-3 shadow-lg">
            <p className="mb-2 text-xs font-medium text-subtle">
              Asignar etiqueta
            </p>

            {all.isLoading && (
              <p className="py-2 text-sm text-muted">Cargando…</p>
            )}

            {available.length > 0 && (
              <div className="mb-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                {available.map((tag) => (
                  <span key={tag.id} className="group inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => apply.mutate(tag.id)}
                      className="rounded-full transition-opacity hover:opacity-80"
                    >
                      <TagChip tag={tag} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTag.mutate(tag.id)}
                      aria-label={`Eliminar etiqueta ${tag.name} del catálogo`}
                      title="Eliminar del catálogo"
                      className="ml-0.5 hidden h-5 w-5 place-items-center rounded text-subtle hover:bg-app hover:text-red-600 group-hover:grid"
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {!all.isLoading && available.length === 0 && (
              <p className="mb-2 text-xs text-muted">
                No hay más etiquetas disponibles.
              </p>
            )}

            <div className="border-t border-line pt-2">
              <p className="mb-1.5 text-xs font-medium text-subtle">
                Nueva etiqueta
              </p>
              <div className="flex gap-1.5">
                <input
                  className={`${fieldInputClass} h-8 text-xs`}
                  placeholder="Nombre…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      e.preventDefault()
                      createAndApply.mutate()
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!name.trim() || createAndApply.isPending}
                  onClick={() => createAndApply.mutate()}
                  aria-label="Crear etiqueta"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="mt-2 flex gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    className={`h-5 w-5 rounded-full transition-transform ${
                      color === c
                        ? 'scale-110 ring-2 ring-brand-500 ring-offset-1'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
