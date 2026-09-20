import { useFinance } from '../model/FinanceContext'
import { yen } from '../../../shared/format'
export function PlannedExpenses() {
  const { data, startEdit, points, last, month, add, remove } = useFinance()
  return (
    <>
      <section>
        <h2>これからの大きな出費</h2>
        <p className="hint">
          引っ越し・旅行・買い替えなど。翌月以降の予定を追加できます。
        </p>
        <form onSubmit={(e) => add(e, 'plan')}>
          <label>
            予定名
            <input
              name="name"
              required
              maxLength={120}
              placeholder="例：引っ越し"
            />
          </label>
          <label>
            予定月
            <input type="month" name="month" min={points[1].month} required />
          </label>
          <label>
            金額（円）
            <input
              name="amount"
              type="number"
              min="0"
              max="1000000000000"
              step="1"
              required
            />
          </label>
          <button className="action">追加</button>
        </form>
        {data.plans.length === 0 ? (
          <p className="empty">予定はまだありません。</p>
        ) : (
          data.plans
            .toSorted((a, b) => a.month.localeCompare(b.month))
            .map((p) => (
              <div className="row" key={p.id}>
                <div>
                  <b>{p.name}</b>
                  <small>
                    {p.month}
                    {p.month <= month
                      ? ' · 過去の予定（予測対象外）'
                      : p.month > last.month
                        ? ' · 表示期間外'
                        : ''}
                  </small>
                </div>
                <strong>{yen(p.amount)}</strong>
                <button
                  onClick={() => startEdit('plans', p.id)}
                  aria-label={`${p.name}を編集`}
                >
                  編集
                </button>
                <button
                  onClick={() => remove('plans', p.id)}
                  aria-label={`${p.name}を削除`}
                >
                  削除
                </button>
              </div>
            ))
        )}
      </section>
    </>
  )
}
