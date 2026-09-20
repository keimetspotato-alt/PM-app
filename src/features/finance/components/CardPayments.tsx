import { useFinance } from '../model/FinanceContext'
import { yen } from '../../../shared/format'
import { today, payCard, reopenCard, linkedCardTotal } from '../domain/finance'
import { BillBudgetFields } from './BillBudgetFields'
export function CardPayments() {
  const { data, setData, startEdit, setPending, add, remove } = useFinance()
  const cards = data.cardPayments ?? []
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>クレカ請求・引き落とし</h2>
          <p>利用記録を請求に紐づけ、引き落としは資金移動として管理します。</p>
        </div>
        <strong>
          {yen(
            cards.filter((p) => !p.paidDate).reduce((s, p) => s + p.amount, 0),
          )}
          <small style={{ display: 'block' }}>未払い合計</small>
        </strong>
      </div>
      <p className="hint">
        請求額はカード会社の合計額を入力します。利用記録はその内訳として扱い、請求額に加算しません。内訳未登録の差額も引き落としには含まれます。
      </p>
      <form onSubmit={(e) => add(e, 'card')}>
        <label>
          カード名・請求月
          <input
            name="name"
            required
            maxLength={100}
            placeholder="例：JCB 10月請求"
          />
        </label>
        <label>
          支払日
          <input name="date" type="date" required min={today()} />
        </label>
        <label>
          請求総額（円）
          <input
            name="amount"
            type="number"
            min="0"
            max="1000000000000"
            step="1"
            required
          />
        </label>
        <BillBudgetFields />
        <button className="action">請求を追加</button>
      </form>
      {cards.length === 0 && (
        <p className="empty">
          請求を追加すると、収支記録でカード払いを選べます。
        </p>
      )}
      {cards
        .toSorted((a, b) => a.date.localeCompare(b.date))
        .map((p) => {
          const linked = linkedCardTotal(data, p.id)
          const names = (p.coveredMonthlyItemIds ?? [])
            .map((id) => data.monthlyItems?.find((i) => i.id === id)?.name)
            .filter(Boolean)
          return (
            <div className="bill" key={p.id}>
              <div className="row">
                <div>
                  <b>{p.name}</b>
                  <small>
                    {p.date} ·{' '}
                    {p.paidDate
                      ? `${p.paidDate} 引き落とし済み`
                      : p.date < today()
                        ? '未払い（期日経過）'
                        : '未払い'}
                  </small>
                </div>
                <strong>{yen(p.amount)}</strong>
                {p.paidDate ? (
                  <button
                    onClick={() =>
                      setPending({
                        text: '引き落としを取り消して未払いに戻します。利用記録はそのまま残ります。',
                        run: () => setData((d) => reopenCard(d, p.id)),
                      })
                    }
                  >
                    未払いに戻す
                  </button>
                ) : (
                  <>
                    <button
                      disabled={p.date > today()}
                      onClick={() =>
                        setPending({
                          text: `${p.name} ${yen(p.amount)}を今日引き落とし済みにしますか？ 残高のみ減り、利用記録は二重に計上されません。`,
                          run: () => setData((d) => payCard(d, p.id)),
                        })
                      }
                    >
                      引き落とし済みにする
                    </button>
                    <button
                      onClick={() => startEdit('cardPayments', p.id)}
                      aria-label={`${p.name}の請求を編集`}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => remove('cardPayments', p.id)}
                      aria-label={`${p.name}の請求を削除`}
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
              <p className="hint">
                利用記録 {yen(linked)} ／ 内訳未登録 {yen(p.amount - linked)}
                <br />
                {names.length
                  ? `予算置き換え（支払月のみ）：${names.join('、')}`
                  : '予算との対応なし：請求額を追加支出として予測します。重複する月額予算がある場合は「編集」から指定してください。'}
              </p>
              {data.transactions
                .filter((t) => t.cardPaymentId === p.id)
                .map((t) => (
                  <p className="hint" key={t.id}>
                    {t.date} · {t.category ?? '未分類'} · {t.name}：
                    {yen(t.amount)}
                  </p>
                ))}
            </div>
          )
        })}
      <p className="hint">
        内訳未登録分は引き落とした月の未分類支出として集計します。支払い済みの請求・利用記録を直すときは、先に「未払いに戻す」を使ってください。
      </p>
    </section>
  )
}
