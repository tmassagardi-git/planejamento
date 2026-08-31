import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Priority, Status } from '../../types'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
      {...props}
    />
  )
}

const priorityStyles: Record<Priority, string> = {
  alta: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  media: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  baixa: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
}

const priorityDot: Record<Priority, string> = {
  alta: 'bg-red-500',
  media: 'bg-amber-500',
  baixa: 'bg-teal-500',
}

export function PriorityBadge({ priority, label }: { priority: Priority; label: string }) {
  return (
    <Badge className={priorityStyles[priority]}>
      <span className={cn('h-1.5 w-1.5 rounded-full', priorityDot[priority])} />
      {label}
    </Badge>
  )
}

const statusStyles: Record<Status, string> = {
  todo: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  delegated: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
}

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return <Badge className={statusStyles[status]}>{label}</Badge>
}
