export type Asset = { id: string; name: string; amount: number }
export type Transaction = {
  id: string
  date: string
  name: string
  kind: 'income' | 'expense'
  amount: number
}
export type Plan = { id: string; month: string; name: string; amount: number }
export type Data = {
  version: 1
  baseDate: string
  assets: Asset[]
  transactions: Transaction[]
  plans: Plan[]
  income: number
  expense: number
  years: number
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
  income: 0,
  expense: 0,
  years: 5,
})
export const signed = (t: Transaction) =>
  t.kind === 'income' ? t.amount : -t.amount
export const balance = (d: Data) =>
  d.assets.reduce((s, a) => s + a.amount, 0) +
  d.transactions.reduce((s, t) => s + signed(t), 0)
export function forecast(d: Data) {
  const start = today().slice(0, 7)
  const [year, month] = start.split('-').map(Number)
  let value = balance(d)
  const points = [{ month: start, balance: value }]
  for (let i = 1; i <= d.years * 12; i++) {
    const date = new Date(year, month - 1 + i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    value +=
      d.income -
      d.expense -
      d.plans.filter((p) => p.month === key).reduce((s, p) => s + p.amount, 0)
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
  return (
    d.version === 1 &&
    date(d.baseDate) &&
    money(d.income) &&
    money(d.expense) &&
    Number.isInteger(d.years) &&
    d.years >= 1 &&
    d.years <= 30 &&
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
        ['income', 'expense'].includes(t.kind),
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
  )
}
