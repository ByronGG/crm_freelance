import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'

// Estilo visual del input SIN ancho, para poder fijar el ancho en cada uso
// (evita conflictos entre w-full y anchos fijos como w-16 en filas flex).
export const fieldBase =
  'h-10 rounded-lg border border-line bg-app px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export const fieldInputClass = `${fieldBase} w-full`

function Label({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      {children}
    </label>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function TextField({ label, ...props }: FieldProps) {
  return (
    <Label label={label}>
      <input className={fieldInputClass} {...props} />
    </Label>
  )
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function TextArea({ label, ...props }: AreaProps) {
  return (
    <Label label={label}>
      <textarea
        className={`${fieldInputClass} h-auto resize-y py-2`}
        {...props}
      />
    </Label>
  )
}
