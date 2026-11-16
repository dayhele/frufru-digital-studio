import { useEffect, useState, type RefObject } from 'react'

/**
 * Vira `true` quando o elemento chega perto da viewport e permanece assim.
 * Usado para só baixar ferramentas pesadas (3D) quando alguém rola até elas.
 */
export function useNearViewport(ref: RefObject<Element | null>, rootMargin = '600px'): boolean {
  const [near, setNear] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || near) return
    if (!('IntersectionObserver' in window)) {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true)
      },
      { rootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, rootMargin, near])

  return near
}

/** Acompanha se o elemento está visível agora (entra e sai). */
export function useInViewport(ref: RefObject<Element | null>, rootMargin = '0px'): boolean {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true), {
      rootMargin,
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  return visible
}
