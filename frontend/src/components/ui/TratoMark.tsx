/**
 * Isotipo de Trato: dos nodos unidos (el acuerdo cerrado) sobre un tile
 * redondeado. Es la misma marca del favicon. El color del tile toma
 * `currentColor`, así que se controla con una clase de texto (p. ej.
 * `text-brand-500`); los nodos son blancos y los puntos internos revelan
 * el color del tile.
 */
export function TratoMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Trato"
    >
      <rect width="48" height="48" rx="11" fill="currentColor" />
      <rect x="16" y="21" width="16" height="6" rx="3" fill="#fff" />
      <circle cx="16" cy="24" r="7" fill="#fff" />
      <circle cx="32" cy="24" r="7" fill="#fff" />
      <circle cx="16" cy="24" r="3" fill="currentColor" />
      <circle cx="32" cy="24" r="3" fill="currentColor" />
    </svg>
  )
}
