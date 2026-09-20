import { useFinance } from '../model/FinanceContext'
import { yen } from '../../../shared/format'
import { today } from '../domain/finance'
export function DashboardPage() {
  const { data, current, targetMonths, targetBalance, setTab, actual } =
    useFinance()
  const upcoming = (data.cardPayments ?? []).toSorted((a, b) =>
    a.date.localeCompare(b.date),
  )
  return (
    <>
      <div className="stats">
        <article className="stat primary">
          <p>現在の資産合計</p>
          <strong>{yen(current)}</strong>
          <small>基準資産と記録した収支から計算</small>
        </article>
        <article className="stat">
          <p>今月の収支実績</p>
          <strong>
            {yen(
              actual.reduce(
                (s, t) => s + (t.kind === 'income' ? t.amount : -t.amount),
                0,
              ),
            )}
          </strong>
          <small>登録済みの記録のみ</small>
        </article>
        <article className="stat">
          <p>{targetMonths}か月後の見込み</p>
          <strong>{yen(targetBalance.balance)}</strong>
          <button onClick={() => setTab('forecast')}>見通しを確認</button>
        </article>
      </div>
      <section>
        <div className="section-heading">
          <h2>次のクレカ支払い</h2>
          <button onClick={() => setTab('transactions')}>
            収支・支払予定へ
          </button>
        </div>
        {upcoming.length ? (
          upcoming.slice(0, 3).map((p) => (
            <div className="row" key={p.id}>
              <div>
                <b>{p.name}</b>
                <small>
                  {p.date}
                  {p.date < today() ? ' · 未払い' : ''}
                </small>
              </div>
              <strong>{yen(p.amount)}</strong>
            </div>
          ))
        ) : (
          <p className="empty">登録された支払予定はありません。</p>
        )}
      </section>
      <section>
        <h2>毎月の計画</h2>
        <p>
          手取り収入 {yen(data.income)} ／ 支出 {yen(data.expense)}
        </p>
        <button onClick={() => setTab('budget')}>毎月の内訳を設定</button>
        <p className="hint">
          実際の記録と、将来予測に使う計画は別々に管理します。
        </p>
      </section>
    </>
  )
}
