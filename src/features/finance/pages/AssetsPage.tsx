import { useFinance } from '../model/FinanceContext'
import { yen } from '../../../shared/format'
import { today } from '../domain/finance'
export function AssetsPage() {
  const { data, startEdit, update, add, remove } = useFinance()
  return (
    <>
      <section>
        <h2>資産のスタート地点</h2>
        <p className="hint">
          基準日時点の現金・預金などを登録します。基準日以降の収支を足し引きするため、同じ金額を二重に記録しないでください。
        </p>
        <label className="date-label">
          資産の基準日
          <input
            type="date"
            value={data.baseDate}
            max={
              data.transactions.length
                ? data.transactions.toSorted((a, b) =>
                    a.date.localeCompare(b.date),
                  )[0].date
                : today()
            }
            disabled={data.transactions.length > 0}
            onChange={(e) => {
              if (e.target.value && e.target.value <= today())
                update({ baseDate: e.target.value })
            }}
          />
        </label>
        <form onSubmit={(e) => add(e, 'asset')}>
          <label>
            資産名
            <input
              name="name"
              required
              maxLength={120}
              placeholder="例：普通預金"
            />
          </label>
          <label>
            残高（円）
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
        {data.assets.length === 0 ? (
          <p className="empty">資産を追加すると、残高の計算が始まります。</p>
        ) : (
          data.assets.map((a) => (
            <div className="row" key={a.id}>
              <b>{a.name}</b>
              <strong>{yen(a.amount)}</strong>
              <button
                onClick={() => startEdit('assets', a.id)}
                aria-label={`${a.name}を編集`}
              >
                編集
              </button>
              <button
                onClick={() => remove('assets', a.id)}
                aria-label={`${a.name}を削除`}
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
