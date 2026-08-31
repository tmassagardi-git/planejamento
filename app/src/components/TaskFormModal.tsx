import { FormEvent, useEffect, useState } from 'react'
import { Modal } from './ui/Modal'
import { Input, Textarea, fieldLabelClasses } from './ui/Input'
import { Select } from './ui/Select'
import { Button } from './ui/Button'
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
  Task,
  TaskInput,
} from '../types'
import { Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (input: TaskInput) => void
  onDelete?: () => void
  initial?: Task | null
  defaultDueDate?: string | null
  defaultStatus?: Task['status']
}

const emptyForm: TaskInput = {
  title: '',
  description: '',
  dueDate: null,
  priority: 'media',
  status: 'todo',
  assignee: '',
  tags: [],
}

export function TaskFormModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  initial,
  defaultDueDate,
  defaultStatus,
}: Props) {
  const [form, setForm] = useState<TaskInput>(emptyForm)
  const [tagsText, setTagsText] = useState('')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description,
        dueDate: initial.dueDate,
        priority: initial.priority,
        status: initial.status,
        assignee: initial.assignee,
        tags: initial.tags,
      })
      setTagsText(initial.tags.join(', '))
    } else {
      setForm({
        ...emptyForm,
        dueDate: defaultDueDate ?? null,
        status: defaultStatus ?? 'todo',
      })
      setTagsText('')
    }
  }, [open, initial, defaultDueDate, defaultStatus])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSubmit({ ...form, title: form.title.trim(), tags })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar tarefa' : 'Nova tarefa'} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={fieldLabelClasses}>Título *</label>
          <Input
            autoFocus
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Enviar relatório mensal"
          />
        </div>

        <div>
          <label className={fieldLabelClasses}>Descrição</label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detalhes da tarefa (opcional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabelClasses}>Prazo</label>
            <Input
              type="date"
              value={form.dueDate ?? ''}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value || null })}
            />
          </div>
          <div>
            <label className={fieldLabelClasses}>Prioridade *</label>
            <Select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
            >
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabelClasses}>Etapa (Kanban)</label>
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Task['status'] })}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={fieldLabelClasses}>Delegada para</label>
            <Input
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              placeholder="Nome da pessoa/equipe"
            />
          </div>
        </div>

        <div>
          <label className={fieldLabelClasses}>Tags (separadas por vírgula)</label>
          <Input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="financeiro, urgente"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {onDelete && (
              <Button type="button" variant="ghost" onClick={onDelete} className="text-red-600 dark:text-red-400">
                <Trash2 size={16} />
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {initial ? 'Salvar alterações' : 'Criar tarefa'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
