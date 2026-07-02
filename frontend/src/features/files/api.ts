import { api } from '../../lib/api'
import type { AttachableType, Attachment, AttachmentInput } from './types'

/** Adjuntos de una entidad concreta. */
export async function listAttachments(
  entityType: AttachableType,
  entityId: string,
): Promise<Attachment[]> {
  const { data } = await api.get<Attachment[]>('/attachments', {
    params: { entityType, entityId },
  })
  return data
}

/** Registra la referencia a un archivo (el binario vive en su URL). */
export async function createAttachment(
  entityType: AttachableType,
  entityId: string,
  input: AttachmentInput,
): Promise<Attachment> {
  const { data } = await api.post<Attachment>('/attachments', {
    filename: input.filename.trim(),
    url: input.url.trim(),
    entityType,
    entityId,
  })
  return data
}

export async function deleteAttachment(id: string): Promise<void> {
  await api.delete(`/attachments/${id}`)
}
