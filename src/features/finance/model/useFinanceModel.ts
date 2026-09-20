import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  balance,
  forecast,
  today,
  validData,
  withMonthlyItems,
} from '../domain/finance'
import type { Data } from '../domain/finance'
import type { FinancePageId } from '../navigation'
import { loadFinance, saveFinance } from '../storage/financeStorage'
export function useFinanceModel() {
  const [loaded] = useState(loadFinance)
  const [data, setData] = useState<Data>(loaded.data)
  const [blocked, setBlocked] = useState(Boolean(loaded.error))
  const [message, setMessage] = useState(loaded.error)
  const [tab, setTab] = useState<FinancePageId>('forecast')
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<{
    collection: 'assets' | 'transactions' | 'plans' | 'cardPayments'
    id: string
    name: string
    amount: number
    date?: string
    month?: string
    kind?: 'income' | 'expense'
  } | null>(null)
  const [editError, setEditError] = useState('')
  function startEdit(
    collection: 'assets' | 'transactions' | 'plans' | 'cardPayments',
    id: string,
  ) {
    const item = data[collection]?.find((item) => item.id === id)
    if (item) {
      setEditError('')
      setEditing({ collection, ...item })
    }
  }
  function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const form = new FormData(e.currentTarget)
    const patch = {
      name: String(form.get('name')).trim(),
      amount: Number(form.get('amount')),
      ...(editing.date !== undefined ? { date: String(form.get('date')) } : {}),
      ...(editing.month !== undefined
        ? { month: String(form.get('month')) }
        : {}),
      ...(editing.kind !== undefined
        ? { kind: form.get('kind') as 'income' | 'expense' }
        : {}),
    }
    const next = {
      ...data,
      [editing.collection]: (data[editing.collection] ?? []).map((item) =>
        item.id === editing.id ? { ...item, ...patch } : item,
      ),
    }
    if (!validData(next)) {
      setEditError(
        '名前・日付・金額を確認してください。金額は0以上の整数で入力してください。',
      )
      return
    }
    setData(withMonthlyItems(next))
    setEditing(null)
    setMessage('変更を保存しました。')
  }
  const [pending, setPending] = useState<{
    text: string
    run: () => void
  } | null>(null)
  useEffect(() => {
    if (blocked) return
    try {
      saveFinance(data)
      // Persistence status reflects the result of synchronizing external storage.
      // oxlint-disable-next-line react/set-state-in-effect
      setSaved(true)
    } catch {
      setSaved(false)
      setMessage(
        '保存できませんでした。バックアップを書き出してデータを保管してください。',
      )
    }
  }, [data, blocked])
  const points = forecast(data),
    current = balance(data),
    last = points[points.length - 1],
    deficit = points.find((p) => p.balance < 0)
  const targetMonths = data.targetMonths ?? 6
  const targetBalance = forecast(data, targetMonths).at(-1)!
  const max = Math.max(...points.map((p) => p.balance), 1),
    min = Math.min(...points.map((p) => p.balance), 0),
    range = max - min
  const y = (v: number) => 180 - ((v - min) / range) * 150
  const line = points
    .map((p, i) => `${40 + (i / (points.length - 1)) * 680},${y(p.balance)}`)
    .join(' ')
  const month = today().slice(0, 7)
  const actual = data.transactions.filter((t) => t.date.startsWith(month))
  const update = (patch: Partial<Data>) => setData((d) => ({ ...d, ...patch }))
  function add(e: FormEvent<HTMLFormElement>, kind: string) {
    e.preventDefault()
    const f = new FormData(e.currentTarget),
      name = String(f.get('name')).trim(),
      amount = Number(f.get('amount'))
    if (!name || !Number.isSafeInteger(amount) || amount < 0 || amount > 1e12) {
      setMessage('名前と0以上の整数の金額を入力してください。')
      return
    }
    const id = crypto.randomUUID()
    if (kind === 'card') {
      const date = String(f.get('date'))
      if (!date || date < today()) {
        setMessage('支払日は今日以降を指定してください。')
        return
      }
      update({
        cardPayments: [
          ...(data.cardPayments ?? []),
          { id, name, amount, date },
        ],
      })
    }
    if (kind === 'asset')
      update({ assets: [...data.assets, { id, name, amount }] })
    if (kind === 'transaction') {
      const date = String(f.get('date'))
      if (date < data.baseDate || date > today()) {
        setMessage('記録日は資産の基準日から今日までにしてください。')
        return
      }
      update({
        transactions: [
          ...data.transactions,
          {
            id,
            name,
            amount,
            date,
            kind: f.get('kind') as 'income' | 'expense',
          },
        ],
      })
    }
    if (kind === 'plan') {
      const planMonth = String(f.get('month'))
      if (planMonth <= month) {
        setMessage('予定は翌月以降を選んでください。')
        return
      }
      update({ plans: [...data.plans, { id, name, amount, month: planMonth }] })
    }
    e.currentTarget.reset()
    setMessage('追加しました。')
  }
  function remove(
    collection: 'assets' | 'transactions' | 'plans' | 'cardPayments',
    id: string,
  ) {
    setPending({
      text: 'この項目を削除しますか？',
      run: () =>
        setData((d) => ({
          ...d,
          [collection]: (d[collection] ?? []).filter((item) => item.id !== id),
        })),
    })
  }
  function backup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pm-app-${today()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function restore(file: File | undefined) {
    if (!file) return
    try {
      const next: unknown = JSON.parse(await file.text())
      if (!validData(next)) throw new Error()
      setPending({
        text: '現在のデータをバックアップの内容で置き換えますか？',
        run: () => {
          setData(withMonthlyItems(next))
          setBlocked(false)
          setMessage('バックアップを復元しました。')
        },
      })
    } catch {
      setMessage(
        'このファイルは読み込めません。PM-appから書き出したJSONを選んでください。',
      )
    }
  }
  return {
    data,
    setData,
    message,
    setMessage,
    tab,
    setTab,
    saved,
    editing,
    setEditing,
    editError,
    startEdit,
    saveEdit,
    pending,
    setPending,
    points,
    current,
    last,
    deficit,
    targetMonths,
    targetBalance,
    max,
    min,
    range,
    y,
    line,
    month,
    actual,
    update,
    add,
    remove,
    backup,
    restore,
  }
}
