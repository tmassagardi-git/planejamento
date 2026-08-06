import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
  width?: string
}

export default function Modal({ title, onClose, children, width = 'max-w-md' }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${width} animate-pop-in rounded-2xl bg-white p-5 shadow-pop`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
