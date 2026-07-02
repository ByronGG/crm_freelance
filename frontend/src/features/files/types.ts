export type AttachableType = 'CONTACT' | 'DEAL' | 'PROJECT'

export interface Attachment {
  id: string
  filename: string
  url: string
  mimeType?: string | null
  size?: number | null
  entityType: AttachableType
  entityId: string
  createdAt: string
}

/** Campos del formulario para registrar un adjunto (referencia por URL). */
export interface AttachmentInput {
  filename: string
  url: string
}
