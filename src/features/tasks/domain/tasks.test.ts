import { describe, expect, it } from 'vitest'
import { validTasks, deleteTask, type TaskData, type Task } from './tasks'
const root: Task = {
  id: 'root',
  title: '準備',
  due: '2026-09-30',
  priority: 'high',
  status: 'todo',
  parentId: null,
}
const child: Task = { ...root, id: 'child', parentId: 'root', title: '手続き' }
const data: TaskData = { version: 1, tasks: [root, child] }
describe('task hierarchy and backups', () => {
  it('accepts a two-level WBS and a JSON roundtrip', () => {
    expect(validTasks(JSON.parse(JSON.stringify(data)))).toBe(true)
  })
  it('rejects orphan children, cycles, duplicate IDs and third levels', () => {
    for (const tasks of [
      [child],
      [{ ...root, parentId: 'child' }, child],
      [root, root],
      [root, child, { ...child, id: 'grandchild', parentId: 'child' }],
    ])
      expect(validTasks({ version: 1, tasks })).toBe(false)
  })
  it('rejects corrupt dates, status and empty titles', () => {
    for (const patch of [
      { due: '2026-02-30' },
      { status: 'unknown' },
      { title: '  ' },
    ])
      expect(validTasks({ version: 1, tasks: [{ ...root, ...patch }] })).toBe(
        false,
      )
  })
  it('deletes descendants while retaining unrelated tasks and the undo snapshot', () => {
    const before: TaskData = {
      version: 1,
      tasks: [root, child, { ...root, id: 'other' }],
    }
    expect(deleteTask(before, 'root').tasks.map((t) => t.id)).toEqual(['other'])
    expect(before.tasks).toHaveLength(3)
    expect(deleteTask(before, 'child').tasks.map((t) => t.id)).toEqual([
      'root',
      'other',
    ])
  })
})
