import { useState, type FormEvent } from 'react'
import {
  deleteTask,
  statuses,
  priorities,
  validTasks,
  type Task,
  type TaskData,
} from './domain/tasks'
import { loadTasks, taskStorageKey } from './storage/taskStorage'
import './tasks.css'
const blank = (): Task => ({
  id: crypto.randomUUID(),
  title: '',
  status: 'todo',
  priority: 'medium',
  due: '',
  parentId: null,
})
export function TasksWorkspace() {
  const [loaded] = useState(loadTasks)
  const [data, setData] = useState(loaded.data)
  const [message, setMessage] = useState(loaded.error)
  const [draft, setDraft] = useState<Task>(blank)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<Task | null>(null)
  const [undo, setUndo] = useState<TaskData | null>(null)
  function commit(next: TaskData) {
    if (loaded.error || !validTasks(next)) return false
    try {
      localStorage.setItem(taskStorageKey, JSON.stringify(next))
      setData(next)
      setMessage('このブラウザに保存しました。')
      return true
    } catch {
      setMessage('保存できませんでした。変更は適用していません。')
      return false
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const task = { ...draft, title: draft.title.trim() }
    if (!task.title) return
    const exists = data.tasks.some((t) => t.id === task.id)
    if (
      commit({
        ...data,
        tasks: exists
          ? data.tasks.map((t) => (t.id === task.id ? task : t))
          : [...data.tasks, task],
      })
    ) {
      setDraft(blank())
      setUndo(null)
    }
  }
  const localDate = new Date()
  const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`
  const matches = (t: Task) =>
    (filter === 'all' || t.status === filter) &&
    t.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  const roots = data.tasks.filter((t) => t.parentId === null)
  const visible = roots.filter(
    (t) =>
      matches(t) || data.tasks.some((c) => c.parentId === t.id && matches(c)),
  )
  function row(t: Task) {
    const children = data.tasks.filter((c) => c.parentId === t.id)
    const complete = children.filter((c) => c.status === 'done').length
    return (
      <div className="task-row" key={t.id}>
        <div className="task-description">
          <b>{t.title}</b>
          <small>
            優先度：{priorities[t.priority]} ·{' '}
            {t.due ? `期限 ${t.due}` : '期限なし'}
            {t.due && t.due < today && t.status !== 'done' && (
              <strong className="negative"> · 期限超過</strong>
            )}
          </small>
          {children.length > 0 && (
            <small>
              子タスク {complete} / {children.length} 完了
            </small>
          )}
        </div>
        <select
          aria-label={`${t.title}の状態`}
          value={t.status}
          disabled={Boolean(loaded.error)}
          onChange={(e) => {
            if (
              commit({
                ...data,
                tasks: data.tasks.map((item) =>
                  item.id === t.id
                    ? { ...item, status: e.target.value as Task['status'] }
                    : item,
                ),
              })
            )
              setUndo(null)
          }}
        >
          {Object.entries(statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={() => setDraft({ ...t })}>編集</button>
        {t.parentId === null && (
          <button onClick={() => setDraft({ ...blank(), parentId: t.id })}>
            子タスク追加
          </button>
        )}
        <button disabled={Boolean(loaded.error)} onClick={() => setPending(t)}>
          削除
        </button>
      </div>
    )
  }
  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">PERSONAL TASKS</p>
          <h1>タスク管理</h1>
          <p className="subtitle">やることを分けて、一つずつ進める。</p>
        </div>
        <span className="save-status">
          {data.tasks.filter((t) => t.status === 'done').length} /{' '}
          {data.tasks.length} 件完了（子タスク含む）
        </span>
      </header>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <section>
        <h2>
          {data.tasks.some((t) => t.id === draft.id)
            ? 'タスクを編集'
            : draft.parentId
              ? '子タスクを追加'
              : 'タスクを追加'}
        </h2>
        {draft.parentId && (
          <p className="hint">
            親タスク：{data.tasks.find((t) => t.id === draft.parentId)?.title}
          </p>
        )}
        <form onSubmit={submit}>
          <label className="task-title">
            タスク名
            <input
              required
              maxLength={120}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="例：引っ越しの準備"
            />
          </label>
          <label>
            期限
            <input
              type="date"
              value={draft.due}
              onChange={(e) => setDraft({ ...draft, due: e.target.value })}
            />
          </label>
          <label>
            優先度
            <select
              value={draft.priority}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  priority: e.target.value as Task['priority'],
                })
              }
            >
              {Object.entries(priorities).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            状態
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as Task['status'] })
              }
            >
              {Object.entries(statuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="action" disabled={Boolean(loaded.error)}>
            保存
          </button>
          <button type="button" onClick={() => setDraft(blank())}>
            入力を取り消す
          </button>
        </form>
        <p className="hint">
          簡易WBSは親・子の2階層です。状態と期限はそれぞれ独立して管理します。子タスクの完了で親の状態は自動変更しません。
        </p>
      </section>
      <section>
        <h2>タスク一覧</h2>
        <div className="task-filters">
          <label>
            検索
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タスク名で検索"
            />
          </label>
          <label>
            状態で絞り込み
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">すべて</option>
              {Object.entries(statuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {visible.length === 0 && (
          <p className="empty">
            {data.tasks.length
              ? '条件に一致するタスクはありません。'
              : 'まずは一つ、やることを登録しましょう。'}
          </p>
        )}
        {visible.map((t) => (
          <article className="task-group" key={t.id}>
            {row(t)}
            <div className="task-children">
              {data.tasks
                .filter(
                  (c) => c.parentId === t.id && (matches(t) || matches(c)),
                )
                .map(row)}
            </div>
          </article>
        ))}
        {undo && (
          <button
            onClick={() => {
              if (commit(undo)) {
                setUndo(null)
                setDraft(blank())
              }
            }}
          >
            直前の削除を元に戻す
          </button>
        )}
      </section>
      <p className="hint">
        データはこのブラウザだけに保存されます。家計簿のJSONバックアップにはタスクは含まれません。
      </p>
      {pending && (
        <div
          className="confirmation"
          role="dialog"
          aria-modal="true"
          aria-label="タスクの削除確認"
        >
          <div>
            <h2>タスクを削除しますか？</h2>
            <p>「{pending.title}」と、その子タスクを削除します。</p>
            <button
              onClick={() => {
                const before = data
                if (commit(deleteTask(data, pending.id))) {
                  setUndo(before)
                  setDraft(blank())
                }
                setPending(null)
              }}
            >
              削除する
            </button>
            <button autoFocus onClick={() => setPending(null)}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
