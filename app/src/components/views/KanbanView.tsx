import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { STATUS_LABELS, STATUS_ORDER, PRIORITY_WEIGHT, Status, Task } from '../../types'
import { KanbanCard } from './KanbanCard'
import { cn } from '../../lib/utils'

const columnAccent: Record<Status, string> = {
  todo: 'border-t-slate-400',
  delegated: 'border-t-violet-500',
  in_progress: 'border-t-blue-500',
  done: 'border-t-emerald-500',
}

function Column({
  status,
  tasks,
  onEdit,
  onAdd,
}: {
  status: Status
  tasks: Task[]
  onEdit: (task: Task) => void
  onAdd: (status: Status) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const sorted = [...tasks].sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border-t-4 bg-slate-100/70 transition-colors dark:bg-slate-900/50',
        columnAccent[status],
        isOver && 'bg-indigo-50 dark:bg-indigo-500/10'
      )}
    >
      <div className="flex items-center justify-between px-3 pt-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {STATUS_LABELS[status]}
          <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-normal text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {tasks.length}
          </span>
        </h3>
        <button
          onClick={() => onAdd(status)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Adicionar tarefa"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-3">
        {sorted.map((task) => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} />
        ))}
        {sorted.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
            Nenhuma tarefa
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanView({
  tasks,
  onEdit,
  onAdd,
  onMove,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onAdd: (status: Status) => void
  onMove: (id: string, status: Status) => void
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as Status
    const task = tasks.find((t) => t.id === active.id)
    if (task && task.status !== newStatus) {
      onMove(task.id, newStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            onEdit={onEdit}
            onAdd={onAdd}
          />
        ))}
      </div>
      <DragOverlay>{activeTask ? <KanbanCard task={activeTask} onEdit={() => {}} /> : null}</DragOverlay>
    </DndContext>
  )
}
