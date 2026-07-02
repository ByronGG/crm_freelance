export type TaggableType = 'CONTACT' | 'DEAL'

export interface Tag {
  id: string
  name: string
  color?: string | null
}

/** Par entidad→etiqueta que devuelve la consulta batch. */
export interface EntityTag {
  entityId: string
  tag: Tag
}
