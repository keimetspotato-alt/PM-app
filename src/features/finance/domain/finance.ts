export type Asset = { id: string; name: string; amount: number }
export type MonthlyItem = {
  id: string
  name: string
  amount: number
  kind: 'income' | 'expense'
  category: string
}
export type PaymentMethod = 'cash' | 'bank' | 'card'
export type Transaction = {
  category?: string
  paymentMethod?: PaymentMethod
  cardPaymentId?: string
  id: string
  date: string
  name: string
  kind: 'income' | 'expense'
  amount: number
}
export type Plan = { id: string; month: string; name: string; amount: number }
export type CardPayment = {
  paidDate?: string
  coveredMonthlyItemIds?: string[]
  id: string
  date: string
  name: string
  amount: number
}
export type Data = {
  version: 1
  baseDate: string
  assets: Asset[]
  transactions: Transaction[]
  plans: Plan[]
  cardPayments?: CardPayment[]
  income: number
  expense: number
  years: number
  targetMonths?: number
  monthlyItems?: MonthlyItem[]
}
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const emptyData = (): Data => ({
  version: 1,
  baseDate: today(),
  assets: [],
  transactions: [],
  plans: [],
  cardPayments: [],
  income: 0,
  expense: 0,
  years: 5,
})
export const signed = (t: Transaction) =>
  t.kind === 'income' ? t.amount : -t.amount
export const balance = (d: Data) =>
  d.assets.reduce((s, a) => s + a.amount, 0) +
  d.transactions.reduce(
    (s, t) => s + (t.paymentMethod === 'card' ? 0 : signed(t)),
    0,
  ) -
  (d.cardPayments ?? [])
    .filter((p) => p.paidDate)
    .reduce((s, p) => s + p.amount, 0)
export function forecast(d: Data, months = d.years * 12) {
  if (!Number.isInteger(months) || months < 1 || months > 360)
    throw new RangeError('期間は1〜360か月で指定してください')
  const start = today().slice(0, 7)
  const [year, month] = start.split('-').map(Number)
  let value = balance(d)
  const cards = (d.cardPayments ?? []).filter((p) => !p.paidDate)
  value -= cards
    .filter((p) => p.date.slice(0, 7) <= start)
    .reduce((s, p) => s + p.amount, 0)
  const points = [{ month: start, balance: value }]
  for (let i = 1; i <= months; i++) {
    const date = new Date(year, month - 1 + i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    value +=
      d.income -
      monthlyExpenseFor(d, key) -
      d.plans.filter((p) => p.month === key).reduce((s, p) => s + p.amount, 0) -
      cards
        .filter((p) => p.date.slice(0, 7) === key)
        .reduce((s, p) => s + p.amount, 0)
    points.push({ month: key, balance: value })
  }
  return points
}
export function validData(value: unknown): value is Data {
  if (!value || typeof value !== 'object') return false
  const d = value as Data
  const money = (n: unknown) =>
    typeof n === 'number' &&
    Number.isSafeInteger(n) &&
    n >= 0 &&
    n <= 1_000_000_000_000
  const text = (s: unknown) =>
    typeof s === 'string' && s.trim().length > 0 && s.length <= 120
  const date = (s: unknown) =>
    typeof s === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  const structureValid =
    d.version === 1 &&
    date(d.baseDate) &&
    money(d.income) &&
    money(d.expense) &&
    Number.isInteger(d.years) &&
    d.years >= 1 &&
    d.years <= 30 &&
    (d.monthlyItems === undefined ||
      (Array.isArray(d.monthlyItems) &&
        d.monthlyItems.every(
          (i) =>
            i &&
            text(i.id) &&
            text(i.name) &&
            text(i.category) &&
            money(i.amount) &&
            ['income', 'expense'].includes(i.kind),
        ))) &&
    (d.targetMonths === undefined ||
      (Number.isInteger(d.targetMonths) &&
        d.targetMonths >= 1 &&
        d.targetMonths <= 360)) &&
    (d.cardPayments === undefined ||
      (Array.isArray(d.cardPayments) &&
        d.cardPayments.every(
          (p) =>
            p &&
            text(p.id) &&
            text(p.name) &&
            money(p.amount) &&
            date(p.date) &&
            (p.paidDate === undefined ||
              (date(p.paidDate) &&
                p.paidDate >= p.date &&
                p.paidDate >= d.baseDate &&
                p.paidDate <= today())) &&
            (p.coveredMonthlyItemIds === undefined ||
              (Array.isArray(p.coveredMonthlyItemIds) &&
                p.coveredMonthlyItemIds.every(text))),
        ))) &&
    Array.isArray(d.assets) &&
    d.assets.every((a) => a && text(a.id) && text(a.name) && money(a.amount)) &&
    Array.isArray(d.transactions) &&
    d.transactions.every(
      (t) =>
        t &&
        text(t.id) &&
        text(t.name) &&
        money(t.amount) &&
        date(t.date) &&
        t.date >= d.baseDate &&
        t.date <= today() &&
        ['income', 'expense'].includes(t.kind) &&
        (t.category === undefined || text(t.category)) &&
        (t.paymentMethod === undefined ||
          ['cash', 'bank', 'card'].includes(t.paymentMethod)) &&
        (t.cardPaymentId === undefined || text(t.cardPaymentId)),
    ) &&
    Array.isArray(d.plans) &&
    d.plans.every(
      (p) =>
        p &&
        text(p.id) &&
        text(p.name) &&
        money(p.amount) &&
        /^\d{4}-(0[1-9]|1[0-2])$/.test(p.month),
    )
  if (!structureValid) return false
  const cards = d.cardPayments ?? []
  if (
    new Set(cards.map((p) => p.id)).size !== cards.length ||
    new Set(d.transactions.map((t) => t.id)).size !== d.transactions.length
  )
    return false
  if (
    d.transactions.some((t) =>
      t.paymentMethod === 'card'
        ? t.kind !== 'expense' ||
          !cards.some((p) => p.id === t.cardPaymentId && t.date <= p.date)
        : t.cardPaymentId !== undefined,
    )
  )
    return false
  return cards.every(
    (p) =>
      linkedCardTotal(d, p.id) <= p.amount &&
      (p.coveredMonthlyItemIds ?? []).every((id) =>
        d.monthlyItems?.some((i) => i.id === id && i.kind === 'expense'),
      ),
  )
}
export function withMonthlyItems(d: Data, items?: MonthlyItem[]): Data {
  const monthlyItems = items ??
    d.monthlyItems ?? [
      ...(d.income
        ? [
            {
              id: 'legacy-income',
              name: 'これまでの手取り収入',
              amount: d.income,
              kind: 'income' as const,
              category: '未分類',
            },
          ]
        : []),
      ...(d.expense
        ? [
            {
              id: 'legacy-expense',
              name: 'これまでの毎月の支出',
              amount: d.expense,
              kind: 'expense' as const,
              category: '未分類',
            },
          ]
        : []),
    ]
  return {
    ...d,
    monthlyItems,
    income: monthlyItems
      .filter((i) => i.kind === 'income')
      .reduce((s, i) => s + i.amount, 0),
    expense: monthlyItems
      .filter((i) => i.kind === 'expense')
      .reduce((s, i) => s + i.amount, 0),
  }
}
export function linkedCardTotal(d: Data, id: string): number {
  return d.transactions
    .filter((t) => t.paymentMethod === 'card' && t.cardPaymentId === id)
    .reduce((s, t) => s + t.amount, 0)
}
export function monthlyExpenseFor(d: Data, month: string): number {
  const covered = new Set(
    (d.cardPayments ?? [])
      .filter((p) => p.date.slice(0, 7) === month)
      .flatMap((p) => p.coveredMonthlyItemIds ?? []),
  )
  return Math.max(
    0,
    d.expense -
      (d.monthlyItems ?? [])
        .filter((i) => i.kind === 'expense' && covered.has(i.id))
        .reduce((s, i) => s + i.amount, 0),
  )
}
export function expenseTotalForMonth(d: Data, month: string): number {
  const recorded = d.transactions
    .filter((t) => t.kind === 'expense' && t.date.startsWith(month))
    .reduce((s, t) => s + t.amount, 0)
  const unitemized = (d.cardPayments ?? [])
    .filter((p) => p.paidDate?.startsWith(month))
    .reduce((s, p) => s + p.amount - linkedCardTotal(d, p.id), 0)
  return recorded + unitemized
}
export function payCard(d: Data, id: string): Data {
  const payment = d.cardPayments?.find((p) => p.id === id)
  if (
    !payment ||
    payment.paidDate ||
    payment.date > today() ||
    today() < d.baseDate
  )
    return d
  return {
    ...d,
    cardPayments: d.cardPayments?.map((p) =>
      p.id === id ? { ...p, paidDate: today() } : p,
    ),
  }
}
export function reopenCard(d: Data, id: string): Data {
  return {
    ...d,
    cardPayments: d.cardPayments?.map((p) => {
      if (p.id !== id) return p
      const { paidDate: _paid, ...rest } = p
      return rest
    }),
  }
}
