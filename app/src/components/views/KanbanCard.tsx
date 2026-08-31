import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PRIORITY_LABELS, Task } from '../../types'
import { PriorityBadge } from '../ui/Badge'
import { formatDueDate, isOverdue } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { Pencil, User } from 'lucide-react'

export function KanbanCard({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const overdue = isOverdue(task)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(task)}
      className={cn(
        'group cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-card transition-shadow hover:shadow-md active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900',
        isDragging && 'opacity-40'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">
          {task.title}
        </p>
        <Pencil
          size={13}
          className="mt-0.5 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 dark:text-slate-600"
        />
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} label={PRIORITY_LABELS[task.priority]} />
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={cn(overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400')}>
          {formatDueDate(task.dueDate)}
        </span>
        {task.assignee && (
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <User size={12} />
            {task.assignee}
          </span>
        )}
      </div>
    </div>
  )
}
