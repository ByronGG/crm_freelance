/** Nombre completo a partir de nombre + apellido (apellido opcional). */
export function fullName(first: string, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ')
}

/** Iniciales (máx. 2) a partir de nombre + apellido separados. */
export function initials(first?: string | null, last?: string | null): string {
  return [first?.[0], last?.[0]].filter(Boolean).join('').toUpperCase()
}

/** Iniciales (máx. 2) a partir de un nombre completo en una sola cadena. */
export function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
