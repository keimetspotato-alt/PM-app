import { useState } from 'react'
import { useFinance } from '../model/FinanceContext'
import type { Transaction } from '../domain/finance'
export function TransactionFields({
  initial,
}: {
  initial?: Partial<Transaction>
}) {
  const { data } = useFinance()
  const [kind, setKind] = useState(initial?.kind ?? 'expense')
  const [method, setMethod] = useState(initial?.paymentMethod ?? 'cash')
  return (
    <>
      <label>
        種類
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as Transaction['kind'])}
        >
          <option value="expense">支出</option>
          <option value="income">収入</option>
        </select>
      </label>
      <label>
        用途・分類
        <input
          name="category"
          list="transaction-categories"
          maxLength={120}
          defaultValue={initial?.category ?? '未分類'}
          required
        />
        <datalist id="transaction-categories">
          {[
            ...new Set([
              '食費',
              'AI',
              '交通費',
              '住居',
              '日用品',
              '未分類',
              ...(data.monthlyItems ?? []).map((i) => i.category),
            ]),
          ].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label>
        {kind === 'income' ? '受取方法' : '支払方法'}
        <select
          name="paymentMethod"
          value={kind === 'income' && method === 'card' ? 'bank' : method}
          onChange={(e) =>
            setMethod(
              e.target.value as NonNullable<Transaction['paymentMethod']>,
            )
          }
        >
          <option value="cash">現金</option>
          <option value="bank">銀行</option>
          {kind === 'expense' && <option value="card">クレカ</option>}
        </select>
      </label>
      {kind === 'expense' && method === 'card' && (
        <label>
          対応するカード請求
          <select
            name="cardPaymentId"
            required
            defaultValue={initial?.cardPaymentId ?? ''}
          >
            <option value="">請求を選択</option>
            {(data.cardPayments ?? [])
              .filter((p) => !p.paidDate)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.date}
                </option>
              ))}
          </select>
          <small>
            先に下のクレカ欄で請求を登録してください。利用日の支出として記録し、残高は引き落とし時に減ります。
          </small>
        </label>
      )}
    </>
  )
}
