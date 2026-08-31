import { useMemo, useState } from 'react'
import { CheckSquare2, Moon, Plus, Sun } from 'lucide-react'
import { useTaskStore } from './store/useTaskStore'
import { useDarkMode } from './store/useDarkMode'
import { ViewSwitcher } from './components/ViewSwitcher'
import { StatsBar } from './components/StatsBar'
import { FilterBar, Filters, applyFilters } from './components/FilterBar'
import { TaskFormModal } from './components/TaskFormModal'
import { ListView } from './components/views/ListView'
import { KanbanView } from './components/views/KanbanView'
import { CalendarView } from './components/views/CalendarView'
import { Button } from './components/ui/Button'
import { Status, Task, TaskInput, ViewMode } from './types'

export default function App() {
  const { tasks, addTask, updateTask, deleteTask, moveTask } = useTaskStore()
  const { dark, toggle } = useDarkMode()

  const [view, setView] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<Filters>({ search: '', priority: 'all' })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultDueDate, setDefaultDueDate] = useState<string | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<Status | undefined>(undefined)

  const filteredTasks = useMemo(() => applyFilters(tasks, filters), [tasks, filters])

  function openNewTask(status?: Status, dueDate?: string) {
    setEditingTask(null)
    setDefaultStatus(status)
    setDefaultDueDate(dueDate ?? null)
    setModalOpen(true)
  }

  function openEditTask(task: Task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  function handleSubmit(input: TaskInput) {
    if (editingTask) {
      updateTask(editingTask.id, input)
    } else {
      addTask(input)
    }
  }

  function handleDelete(id: string) {
    if (confirm('Excluir esta tarefa? Essa ação não pode ser desfeita.')) {
      deleteTask(id)
      setModalOpen(false)
    }
  }

  function toggleDone(task: Task) {
    updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <CheckSquare2 size={18} />
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button variant="primary" onClick={() => openNewTask()}>
              <Plus size={16} />
              Nova tarefa
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <StatsBar tasks={tasks} />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ViewSwitcher value={view} onChange={setView} />
          <div className="lg:w-[420px]">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>
        </div>

        {view === 'list' && (
          <ListView
            tasks={filteredTasks}
            onEdit={openEditTask}
            onDelete={deleteTask}
            onToggleDone={toggleDone}
          />
        )}

        {view === 'kanban' && (
          <KanbanView
            tasks={filteredTasks}
            onEdit={openEditTask}
            onAdd={(status) => openNewTask(status)}
            onMove={moveTask}
          />
        )}

        {view === 'calendar' && (
          <CalendarView
            tasks={filteredTasks}
            onEdit={openEditTask}
            onAddOnDate={(iso) => openNewTask(undefined, iso)}
          />
        )}
      </main>

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingTask ? () => handleDelete(editingTask.id) : undefined}
        initial={editingTask}
        defaultDueDate={defaultDueDate}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
