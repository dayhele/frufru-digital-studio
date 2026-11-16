import { useEffect, useState } from 'react'

export type CmsState<T> =
  | { status: 'loading'; data: null }
  | { status: 'ready'; data: T }
  | { status: 'error'; data: null }

/**
 * Lê uma função de `client.ts`. `fetcher` deve ser estável (referência de
 * módulo ou `useCallback`); `key` refaz a leitura quando muda.
 */
export function useCms<T>(fetcher: () => Promise<T>, key: string = ''): CmsState<T> {
  const [state, setState] = useState<CmsState<T>>({ status: 'loading', data: null })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null })
    fetcher().then(
      (data) => {
        if (!cancelled) setState({ status: 'ready', data })
      },
      () => {
        if (!cancelled) setState({ status: 'error', data: null })
      },
    )
    return () => {
      cancelled = true
    }
  }, [fetcher, key])

  return state
}
