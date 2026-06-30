import { Construction } from 'lucide-react'

/** Página temporal para módulos cuya UI se construirá en los siguientes pasos. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-medium text-fg">{title}</h1>
      <div className="mt-6 grid place-items-center rounded-xl border border-dashed border-line bg-surface py-16 text-center">
        <Construction size={28} className="text-subtle" />
        <p className="mt-3 text-sm font-medium text-fg">Próximamente</p>
        <p className="mt-1 max-w-xs text-sm text-muted">
          La pantalla de {title.toLowerCase()} se construirá en el siguiente
          paso. El backend ya está listo.
        </p>
      </div>
    </div>
  )
}
