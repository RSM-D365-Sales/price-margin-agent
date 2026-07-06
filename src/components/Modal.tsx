import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  sub?: string
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
}

export function Modal({ title, sub, onClose, children, actions }: ModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {sub ? <div className="modal-sub">{sub}</div> : null}
        {children}
        <div className="modal-actions">
          {actions ?? (
            <button className="btn ghost" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
