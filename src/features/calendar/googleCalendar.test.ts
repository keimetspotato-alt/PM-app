import { afterEach, expect, it, vi } from 'vitest'
import {
  CalendarError,
  eventTime,
  listEvents,
  monthRange,
} from './googleCalendar'
afterEach(() => vi.unstubAllGlobals())
it('uses month boundaries including the next year', () => {
  const range = monthRange('2026-12')
  expect(new Date(range.timeMin).getMonth()).toBe(11)
  expect(new Date(range.timeMax).getFullYear()).toBe(2027)
  expect(() => monthRange('2026-13')).toThrow()
})
it('displays all-day dates using the exclusive end date', () => {
  expect(
    eventTime({
      id: 'a',
      start: { date: '2026-09-01' },
      end: { date: '2026-09-02' },
    }),
  ).toBe('2026-09-01 · 終日')
  expect(
    eventTime({
      id: 'a',
      start: { date: '2026-09-01' },
      end: { date: '2026-09-04' },
    }),
  ).toBe('2026-09-01 〜 2026-09-03 · 終日')
})
it('loads all pages, expands recurring events and omits cancelled events', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 'a' }, { id: 'cancelled', status: 'cancelled' }],
        nextPageToken: 'next',
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ id: 'b' }] }),
    })
  vi.stubGlobal('fetch', fetcher)
  expect(
    (
      await listEvents('test-token', '2026-09', new AbortController().signal)
    ).map((e) => e.id),
  ).toEqual(['a', 'b'])
  const [url, options] = fetcher.mock.calls[0]
  expect(url).toContain('singleEvents=true')
  expect(url).not.toContain('test-token')
  expect(options.headers.Authorization).toBe('Bearer test-token')
  expect(fetcher.mock.calls[1][0]).toContain('pageToken=next')
})
it('surfaces authorization errors without exposing server responses', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
  await expect(
    listEvents('test', '2026-09', new AbortController().signal),
  ).rejects.toEqual(new CalendarError(401))
})
it('passes cancellation to the request', async () => {
  const controller = new AbortController()
  controller.abort()
  const fetcher = vi
    .fn()
    .mockRejectedValue(new DOMException('Aborted', 'AbortError'))
  vi.stubGlobal('fetch', fetcher)
  await expect(
    listEvents('test', '2026-09', controller.signal),
  ).rejects.toHaveProperty('name', 'AbortError')
  expect(fetcher.mock.calls[0][1].signal).toBe(controller.signal)
})
