import { describe, it, expect } from 'vitest'
import {
  balance,
  emptyData,
  forecast,
  today,
  validData,
  payCard,
} from './finance'
describe('household calculations', () => {
  it('includes current and future card bills once without changing assets until paid', () => {
    const d = emptyData()
    d.assets = [{ id: 'a', name: '預金', amount: 100000 }]
    d.years = 1
    const next = forecast(d)[1].month
    d.cardPayments = [
      { id: 'c', name: 'カード', date: today(), amount: 10000 },
      { id: 'n', name: '翌月', date: `${next}-10`, amount: 20000 },
    ]
    expect(balance(d)).toBe(100000)
    expect(forecast(d)[0].balance).toBe(90000)
    expect(forecast(d)[1].balance).toBe(70000)
    const paid = payCard(d, 'c')
    expect(balance(paid)).toBe(90000)
    expect(forecast(paid)[1].balance).toBe(70000)
    expect(payCard(paid, 'c')).toEqual(paid)
  })
  it('accepts old backups and rejects malformed card bills', () => {
    const d = emptyData()
    delete d.cardPayments
    expect(validData(d)).toBe(true)
    expect(
      validData({
        ...d,
        cardPayments: [
          { id: 'c', name: 'カード', date: '2026-02-30', amount: 1 },
        ],
      }),
    ).toBe(false)
  })
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
