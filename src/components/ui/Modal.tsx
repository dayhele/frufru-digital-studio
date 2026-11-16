import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  /** id do título visível dentro do modal. */
  labelledBy: string
  className?: string
  children: ReactNode
}

/**
 * Modal sobre <dialog> nativo: o navegador cuida de prender o foco, tornar o
 * fundo inerte, fechar com Esc e devolver o foco ao elemento de origem.
 */
export function Modal({ open, onClose, labelledBy, className, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Trava a rolagem da página enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        // Clique direto no <dialog> é clique no fundo: o conteúdo fica num filho.
        if (event.target === event.currentTarget) onClose()
      }}
      className={cn(
        'm-auto max-h-[calc(100dvh-2rem)] w-[min(100vw-2rem,60rem)] max-w-none overflow-visible bg-transparent p-0',
        'backdrop:bg-ink/75',
        className,
      )}
    >
      {open ? children : null}
    </dialog>
  )
}
