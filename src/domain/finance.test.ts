import { describe, it, expect } from 'vitest'
import { balance, emptyData, forecast, today, validData } from './finance'
describe('household calculations', () => {
  it('applies recorded transactions once, then monthly assumptions from next month', () => {
    const d = emptyData()
    d.assets = [{ id: 'a', name: '銀行', amount: 100000 }]
    d.transactions = [
      { id: 't', name: '食費', amount: 2000, kind: 'expense', date: today() },
    ]
    d.income = 30000
    d.expense = 20000
    d.years = 1
    expect(balance(d)).toBe(98000)
    expect(forecast(d).at(-1)?.balance).toBe(218000)
  })
  it('subtracts one-off plans in the matching month and allows negative balances', () => {
    const d = emptyData()
    d.years = 1
    const month = forecast(d)[1].month
    d.plans = [{ id: 'p', name: '旅行', month, amount: 50000 }]
    expect(forecast(d)[1].balance).toBe(-50000)
    expect(forecast(d).at(-1)?.balance).toBe(-50000)
  })
  it('rejects corrupted and invalid imported data', () => {
    expect(validData(emptyData())).toBe(true)
    expect(validData({ ...emptyData(), income: -1 })).toBe(false)
    expect(validData({ ...emptyData(), assets: [null] })).toBe(false)
    expect(validData({ ...emptyData(), baseDate: '2026-02-30' })).toBe(false)
  })
})
