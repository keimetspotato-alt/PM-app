export type Task = {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  due: string
  parentId: string | null
}
export type TaskData = { version: 1; tasks: Task[] }
export const statuses = { todo: '未着手', doing: '進行中', done: '完了' }
export const priorities = { low: '低', medium: '中', high: '高' }
export function validTasks(value: unknown): value is TaskData {
  if (!value || typeof value !== 'object') return false
  const d = value as TaskData
  if (d.version !== 1 || !Array.isArray(d.tasks)) return false
  if (
    !d.tasks.every(
      (t) =>
        t &&
        typeof t.id === 'string' &&
        t.id.length > 0 &&
        typeof t.title === 'string' &&
        t.title.trim().length > 0 &&
        t.title.length <= 120 &&
        Object.hasOwn(statuses, t.status) &&
        Object.hasOwn(priorities, t.priority) &&
        typeof t.due === 'string' &&
        (t.due === '' ||
          (/^\d{4}-\d{2}-\d{2}$/.test(t.due) &&
            !Number.isNaN(Date.parse(t.due)) &&
            new Date(t.due).toISOString().slice(0, 10) === t.due)) &&
        (t.parentId === null || typeof t.parentId === 'string'),
    )
  )
    return false
  const byId = new Map(d.tasks.map((t) => [t.id, t]))
  if (byId.size !== d.tasks.length) return false
  return d.tasks.every(
    (t) =>
      t.parentId === null ||
      (t.parentId !== t.id && byId.get(t.parentId)?.parentId === null),
  )
}
export function deleteTask(data: TaskData, id: string): TaskData {
  return {
    ...data,
    tasks: data.tasks.filter((t) => t.id !== id && t.parentId !== id),
  }
}
