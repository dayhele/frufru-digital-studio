/**
 * Rola até uma seção depois que modais fecharem: o <dialog> devolve o foco ao
 * botão de origem ao fechar, o que puxaria a página de volta. Esperar dois
 * quadros garante que a rolagem vem depois dessa devolução.
 */
export function scrollToSection(id: string): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const target = document.getElementById(id)
      if (!target) return
      target.scrollIntoView()
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
      history.replaceState(history.state, '', `#${id}`)
    }),
  )
}
