import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Lee `?focus=<id>` del querystring (usado al navegar desde una notificación),
 * lo devuelve para resaltar la fila y lo limpia de la URL tras unos segundos
 * para que el resaltado se apague solo.
 */
export function useFocusHighlight(): string | null {
  const [params, setParams] = useSearchParams()
  const focus = params.get('focus')
  const [active, setActive] = useState<string | null>(focus)

  useEffect(() => {
    if (!focus) return
    setActive(focus)
    const timer = setTimeout(() => {
      setActive(null)
      setParams(
        (prev) => {
          prev.delete('focus')
          return prev
        },
        { replace: true },
      )
    }, 3500)
    return () => clearTimeout(timer)
  }, [focus, setParams])

  return active
}
