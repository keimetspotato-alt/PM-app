import { validTasks, type TaskData } from '../domain/tasks'
export const taskStorageKey = 'pm-app.tasks.v1'
export function loadTasks(): { data: TaskData; error: string } {
  try {
    const raw = localStorage.getItem(taskStorageKey)
    if (raw === null) return { data: { version: 1, tasks: [] }, error: '' }
    const data: unknown = JSON.parse(raw)
    if (!validTasks(data)) throw new Error()
    return { data, error: '' }
  } catch {
    return {
      data: { version: 1, tasks: [] },
      error:
        'タスクを読み込めないため保存を停止しました。保存データを確認してください。',
    }
  }
}
