import { X } from 'lucide-react'

import type { Tag } from './types'

// Color del punto cuando la etiqueta no tiene color propio.
const DEFAULT_DOT = '#9CA3AF'

/** Chip de etiqueta: punto de color + nombre, con quitar opcional. */
export function TagChip({
  tag,
  onRemove,
}: {
  tag: Tag
  onRemove?: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-app px-2 py-0.5 text-xs text-fg">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: tag.color || DEFAULT_DOT }}
      />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar etiqueta ${tag.name}`}
          className="grid h-3.5 w-3.5 place-items-center rounded-full text-subtle transition-colors hover:bg-line hover:text-fg"
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}
