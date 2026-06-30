import { Button } from './Button'
import { Modal } from './Modal'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Diálogo de confirmación para acciones destructivas (borrar). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  loading,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Eliminando…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
