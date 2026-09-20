import { useState } from 'react'
import type { FormEvent } from 'react'
import type { MonthlyItem } from '../domain/finance'
const yen = (v: number) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(
    v,
  )
const categories = [
  '給与',
  '副業',
  'その他収入',
  '住居',
  '食費',
  '日用品',
  '水道光熱費',
  '通信費',
  '交通費',
  '保険',
  'サブスク',
  'AI',
  '娯楽',
  '医療',
  '教育',
  'その他',
  '未分類',
]
export function MonthlyBudget({
  items,
  onChange,
}: {
  items: MonthlyItem[]
  onChange: (items: MonthlyItem[]) => boolean
}) {
  const [edit, setEdit] = useState<MonthlyItem | null>(null)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [removed, setRemoved] = useState<MonthlyItem | null>(null)
  const income = items
    .filter((i) => i.kind === 'income')
    .reduce((s, i) => s + i.amount, 0)
  const expense = items
    .filter((i) => i.kind === 'expense')
    .reduce((s, i) => s + i.amount, 0)
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name')).trim(),
      category = String(f.get('category')).trim(),
      amount = Number(f.get('amount')),
      kind = f.get('kind') as MonthlyItem['kind']
    if (
      !name ||
      !category ||
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      amount > 1e12
    ) {
      setError('項目名・分類と、0以上の整数の金額を入力してください。')
      return
    }
    const item = {
      id: edit?.id ?? crypto.randomUUID(),
      name,
      category,
      amount,
      kind,
    }
    const accepted = onChange(
      edit ? items.map((i) => (i.id === edit.id ? item : i)) : [...items, item],
    )
    if (!accepted) return
    setEdit(null)
    setRevision((r) => r + 1)
    setError('')
  }
  return (
    <>
      <div className="stats">
        <article className="stat">
          <p>毎月の手取り収入</p>
          <strong>{yen(income)}</strong>
        </article>
        <article className="stat">
          <p>毎月の支出</p>
          <strong>{yen(expense)}</strong>
        </article>
        <article className="stat primary">
          <p>毎月の収支</p>
          <strong>{yen(income - expense)}</strong>
        </article>
      </div>
      <section>
        <h2>毎月の内訳</h2>
        <p className="hint">
          ここで設定した月額の合計を将来残高に反映します。実際の収支記録には自動登録しません。年払いは月額換算するか「大きな出費」で管理してください。
        </p>
        <p className="hint">
          以前の合計金額は「未分類」として引き継いでいます。詳しい内訳を追加する際は、引き継いだ項目を編集・削除して二重計上を防いでください。カード請求が確定したら、クレカ欄で対応する内訳を選ぶと、引き落とし月の予算を請求額に置き換えられます。
        </p>
        <h3>{edit ? '内訳を編集' : '内訳を追加'}</h3>
        <form key={`${edit?.id ?? 'new'}-${revision}`} onSubmit={save}>
          <label>
            収入・支出
            <select name="kind" defaultValue={edit?.kind ?? 'expense'}>
              <option value="expense">支出</option>
              <option value="income">手取り収入</option>
            </select>
          </label>
          <label>
            項目名
            <input
              name="name"
              required
              maxLength={120}
              defaultValue={edit?.name}
              placeholder="例：ChatGPT、家賃、給与"
            />
          </label>
          <label>
            分類
            <input
              name="category"
              list="monthly-categories"
              required
              maxLength={120}
              defaultValue={edit?.category}
              placeholder="選択・自由入力"
            />
            <datalist id="monthly-categories">
              {[
                ...new Set([...categories, ...items.map((i) => i.category)]),
              ].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            月額（円）
            <input
              name="amount"
              type="number"
              required
              min="0"
              max="1000000000000"
              step="1"
              defaultValue={edit?.amount}
            />
          </label>
          <button className="action">
            {edit ? '変更を保存' : '内訳を追加'}
          </button>
          {edit && (
            <button
              type="button"
              onClick={() => {
                setEdit(null)
                setError('')
              }}
            >
              キャンセル
            </button>
          )}
        </form>
        {error && <p role="alert">{error}</p>}
        {removed && (
          <p role="status">
            「{removed.name}」を削除しました。
            <button
              onClick={() => {
                if (!onChange([...items, removed])) return
                setRemoved(null)
              }}
            >
              元に戻す
            </button>
          </p>
        )}
        {(['income', 'expense'] as const).map((kind) => (
          <div key={kind}>
            <h3>{kind === 'income' ? '手取り収入の内訳' : '支出の内訳'}</h3>
            {items.filter((i) => i.kind === kind).length === 0 ? (
              <p className="empty">まだ項目がありません。</p>
            ) : (
              items
                .filter((i) => i.kind === kind)
                .map((i) => (
                  <div className="row" key={i.id}>
                    <div>
                      <b>{i.name}</b>
                      <small>{i.category}</small>
                    </div>
                    <strong>{yen(i.amount)} / 月</strong>
                    <button
                      onClick={() => {
                        setEdit(i)
                        setError('')
                      }}
                      aria-label={`${i.name}の内訳を編集`}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => {
                        if (!onChange(items.filter((x) => x.id !== i.id)))
                          return
                        setRemoved(i)
                        if (edit?.id === i.id) setEdit(null)
                      }}
                      aria-label={`${i.name}の内訳を削除`}
                    >
                      削除
                    </button>
                  </div>
                ))
            )}
          </div>
        ))}
      </section>
      <section>
        <h2>分類ごとの月額</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>収支</th>
                <th>分類</th>
                <th>合計</th>
              </tr>
            </thead>
            <tbody>
              {(['income', 'expense'] as const).flatMap((kind) =>
                [
                  ...new Set(
                    items.filter((i) => i.kind === kind).map((i) => i.category),
                  ),
                ].map((c) => (
                  <tr key={`${kind}-${c}`}>
                    <td>{kind === 'income' ? '収入' : '支出'}</td>
                    <td>{c}</td>
                    <td>
                      {yen(
                        items
                          .filter((i) => i.kind === kind && i.category === c)
                          .reduce((s, i) => s + i.amount, 0),
                      )}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p className="empty">
            内訳を追加すると、分類ごとの合計が表示されます。
          </p>
        )}
      </section>
    </>
  )
}
