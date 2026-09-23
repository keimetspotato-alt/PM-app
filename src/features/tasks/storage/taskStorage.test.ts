import { afterEach, expect, it, vi } from 'vitest'
import { loadTasks } from './taskStorage'
afterEach(() => vi.unstubAllGlobals())
it('loads a new workspace without an error', () => {
  vi.stubGlobal('localStorage', { getItem: () => null })
  expect(loadTasks()).toEqual({ data: { version: 1, tasks: [] }, error: '' })
})
it('blocks malformed data without overwriting it', () => {
  const setItem = vi.fn()
  vi.stubGlobal('localStorage', { getItem: () => '{broken', setItem })
  expect(loadTasks().error).not.toBe('')
  expect(setItem).not.toHaveBeenCalled()
})
it('handles unavailable storage', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('denied')
    },
  })
  expect(loadTasks().error).not.toBe('')
})
