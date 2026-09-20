import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  balance,
  emptyData,
  forecast,
  payCard,
  reopenCard,
  validData,
  withMonthlyItems,
  expenseTotalForMonth,
  linkedCardTotal,
} from './finance'
import type { Data } from './finance'
afterEach(() => vi.useRealTimers())
function fixture(): Data {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 20, 12))
  const d = withMonthlyItems(
    {
      ...emptyData(),
      baseDate: '2026-09-01',
      assets: [{ id: 'a', name: '銀行', amount: 100000 }],
    },
    [
      {
        id: 'food',
        name: '食費',
        category: '食費',
        kind: 'expense',
        amount: 50000,
      },
      { id: 'ai', name: 'AI', category: 'AI', kind: 'expense', amount: 3000 },
    ],
  )
  d.cardPayments = [
    { id: 'bill', name: 'カード', date: '2026-09-20', amount: 10000 },
  ]
  d.transactions = [
    {
      id: 'purchase',
      name: '買い物',
      date: '2026-09-10',
      kind: 'expense',
      category: '食費',
      paymentMethod: 'card',
      cardPaymentId: 'bill',
      amount: 8000,
    },
  ]
  return d
}
describe('card reconciliation', () => {
  it('counts purchase as spending but decreases cash only on settlement, including unitemized remainder', () => {
    const d = fixture()
    expect(validData(d)).toBe(true)
    expect(balance(d)).toBe(100000)
    expect(expenseTotalForMonth(d, '2026-09')).toBe(8000)
    const paid = payCard(d, 'bill')
    expect(balance(paid)).toBe(90000)
    expect(expenseTotalForMonth(paid, '2026-09')).toBe(10000)
    expect(paid.transactions).toEqual(d.transactions)
    expect(payCard(paid, 'bill')).toEqual(paid)
    expect(forecast(paid, 1)).toEqual(forecast(d, 1))
    expect(validData(paid)).toBe(true)
    expect(reopenCard(paid, 'bill')).toEqual(d)
  })
  it('replaces only selected monthly budgets in the due month, retaining uncovered budgets', () => {
    const d = fixture()
    d.cardPayments = [
      {
        id: 'bill',
        name: 'カード',
        date: '2026-10-20',
        amount: 40000,
        coveredMonthlyItemIds: ['food'],
      },
    ]
    expect(forecast(d, 1)[1].balance).toBe(57000)
    expect(forecast(d, 2)[2].balance).toBe(4000)
    const noMatch = {
      ...d,
      cardPayments: d.cardPayments.map((p) => ({
        ...p,
        coveredMonthlyItemIds: [],
      })),
    }
    expect(forecast(noMatch, 1)[1].balance).toBe(7000)
  })
  it('removes a budget once even when two invoices together cover it', () => {
    const d = fixture()
    d.transactions = []
    d.cardPayments = [
      {
        id: 'a',
        name: 'A',
        date: '2026-10-10',
        amount: 20000,
        coveredMonthlyItemIds: ['food'],
      },
      {
        id: 'b',
        name: 'B',
        date: '2026-10-20',
        amount: 25000,
        coveredMonthlyItemIds: ['food'],
      },
    ]
    expect(forecast(d, 1)[1].balance).toBe(52000)
  })
  it('rejects dangling links, over-itemized invoices, future settlements and deleted covered budgets', () => {
    const d = fixture()
    expect(validData({ ...d, cardPayments: [] })).toBe(false)
    expect(
      validData({
        ...d,
        transactions: d.transactions.map((t) => ({ ...t, amount: 11000 })),
      }),
    ).toBe(false)
    expect(
      validData({
        ...d,
        cardPayments: d.cardPayments!.map((p) => ({
          ...p,
          coveredMonthlyItemIds: ['missing'],
        })),
      }),
    ).toBe(false)
    expect(
      validData({
        ...d,
        cardPayments: d.cardPayments!.map((p) => ({
          ...p,
          paidDate: '2026-09-21',
        })),
      }),
    ).toBe(false)
    expect(
      payCard(
        {
          ...d,
          cardPayments: d.cardPayments!.map((p) => ({
            ...p,
            date: '2026-10-20',
          })),
        },
        'bill',
      ).cardPayments?.[0].paidDate,
    ).toBeUndefined()
  })
  it('preserves legacy cash behavior without guessing a match', () => {
    const d = fixture()
    d.transactions = [
      {
        id: 'old',
        name: '以前の支出',
        amount: 8000,
        kind: 'expense',
        date: '2026-09-10',
      },
    ]
    expect(validData(d)).toBe(true)
    expect(balance(d)).toBe(92000)
    expect(linkedCardTotal(d, 'bill')).toBe(0)
    expect(withMonthlyItems(d).transactions).toEqual(d.transactions)
  })
  it('keeps expenses in the purchase month rather than double counting in the payment month', () => {
    const d = fixture()
    d.transactions[0].amount = 10000
    d.cardPayments![0].date = '2026-10-20'
    vi.setSystemTime(new Date(2026, 9, 20, 12))
    const paid = payCard(d, 'bill')
    expect(expenseTotalForMonth(paid, '2026-09')).toBe(10000)
    expect(expenseTotalForMonth(paid, '2026-10')).toBe(0)
    expect(balance(paid)).toBe(90000)
  })
})
