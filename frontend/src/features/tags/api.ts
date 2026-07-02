import { api } from '../../lib/api'
import type { EntityTag, Tag, TaggableType } from './types'

export async function listTags(): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>('/tags')
  return data
}

export async function createTag(
  name: string,
  color?: string,
): Promise<Tag> {
  const { data } = await api.post<Tag>('/tags', {
    name: name.trim(),
    ...(color ? { color } : {}),
  })
  return data
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete(`/tags/${id}`)
}

/** Etiquetas aplicadas a una entidad concreta. */
export async function listTagsForEntity(
  entityType: TaggableType,
  entityId: string,
): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>(
    `/tags/entity/${entityType}/${entityId}`,
  )
  return data
}

/** Etiquetas de varias entidades a la vez (chips en listados sin N+1). */
export async function listTagsForEntities(
  entityType: TaggableType,
  ids: string[],
): Promise<EntityTag[]> {
  if (ids.length === 0) return []
  const { data } = await api.get<EntityTag[]>('/tags/for-entities', {
    params: { entityType, ids: ids.join(',') },
  })
  return data
}

export async function applyTag(
  tagId: string,
  entityType: TaggableType,
  entityId: string,
): Promise<void> {
  await api.post(`/tags/${tagId}/apply`, { entityType, entityId })
}

export async function unapplyTag(
  tagId: string,
  entityType: TaggableType,
  entityId: string,
): Promise<void> {
  await api.delete(`/tags/${tagId}/apply`, {
    data: { entityType, entityId },
  })
}
