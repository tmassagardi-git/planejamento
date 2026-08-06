import { Building2, Video } from 'lucide-react'
import type { Modality } from '../types'

type Props = {
  modality?: Modality
  size?: number
  className?: string
}

export default function ModalityIcon({ modality, size = 11, className }: Props) {
  if (!modality) return null
  const Icon = modality === 'online' ? Video : Building2
  return (
    <Icon
      size={size}
      className={`shrink-0 ${className ?? ''}`}
      style={{ opacity: 0.7 }}
      aria-label={modality === 'online' ? 'Online' : 'Presencial'}
    />
  )
}
