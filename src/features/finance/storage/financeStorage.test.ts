import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadFinance, saveFinance } from './financeStorage'
import { emptyData } from '../domain/finance'
afterEach(() => vi.unstubAllGlobals())
describe('finance storage compatibility', () => {
  it('loads the existing storage key and preserves balances and plans', () => {
    const legacy = {
      ...emptyData(),
      income: 123000,
      expense: 45600,
      plans: [{ id: 'p', name: '旅行', month: '2027-01', amount: 10000 }],
    }
    const getItem = vi.fn(() => JSON.stringify(legacy))
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { getItem, setItem })
    const loaded = loadFinance()
    expect(getItem).toHaveBeenCalledWith('pm-app.finance.v1')
    expect(loaded.error).toBe('')
    expect(loaded.data.income).toBe(123000)
    expect(loaded.data.plans).toEqual(legacy.plans)
    expect(setItem).not.toHaveBeenCalled()
  })
  it('leaves malformed stored data untouched and reports recovery state', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { getItem: () => '{bad', setItem })
    expect(loadFinance().error).not.toBe('')
    expect(setItem).not.toHaveBeenCalled()
  })
  it('round trips the unchanged JSON format', () => {
    let raw: string | null = null
    vi.stubGlobal('localStorage', {
      getItem: () => raw,
      setItem: (_key: string, value: string) => {
        raw = value
      },
    })
    const data = emptyData()
    saveFinance(data)
    expect(loadFinance().data.baseDate).toBe(data.baseDate)
    expect(loadFinance().data.transactions).toEqual(data.transactions)
  })
})
