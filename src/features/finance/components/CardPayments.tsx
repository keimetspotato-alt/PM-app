import { useFinance } from '../model/FinanceContext'
import { yen } from '../../../shared/format'
import { today, payCard } from '../domain/finance'
export function CardPayments() {
  const { data, setData, startEdit, setPending, add, remove } = useFinance()
  return (
    <>
      <section>
        <div className="section-heading">
          <div>
            <h2>クレカの支払予定</h2>
            <p>カードごとに、引き落とし日と請求額を登録できます。</p>
          </div>
          <strong>
            {yen((data.cardPayments ?? []).reduce((s, p) => s + p.amount, 0))}
            <small style={{ display: 'block' }}>未払い合計</small>
          </strong>
        </div>
        <p className="hint">
          登録した金額は毎月の支出見込みに追加して差し引きます。同じ請求分を毎月の支出・大きな出費・収支記録へ重複して入れないでください。登録だけでは現在の資産合計は変わりません。
        </p>
        <form onSubmit={(e) => add(e, 'card')}>
          <label>
            カード名・メモ
            <input
              name="name"
              required
              maxLength={100}
              placeholder="例：楽天カード 10月請求"
            />
          </label>
          <label>
            支払日
            <input name="date" type="date" min={today()} required />
          </label>
          <label>
            支払予定額（円）
            <input
              name="amount"
              type="number"
              min="0"
              max="1000000000000"
              step="1"
              required
            />
          </label>
          <button className="action">支払予定を追加</button>
        </form>
        {(data.cardPayments ?? []).length === 0 ? (
          <p className="empty">クレカの支払予定はまだありません。</p>
        ) : (
          (data.cardPayments ?? [])
            .toSorted((a, b) => a.date.localeCompare(b.date))
            .map((p) => (
              <div className="row" key={p.id}>
                <div>
                  <b>{p.name}</b>
                  <small>
                    {p.date}
                    {p.date < today()
                      ? ' · 支払日を過ぎています'
                      : p.date === today()
                        ? ' · 本日支払い'
                        : ''}
                  </small>
                </div>
                <strong>{yen(p.amount)}</strong>
                <button
                  disabled={p.date > today()}
                  onClick={() =>
                    setPending({
                      text: `${p.name} ${yen(p.amount)}を支払い済みにし、今日の支出に記録しますか？`,
                      run: () => setData((d) => payCard(d, p.id)),
                    })
                  }
                >
                  支払い済みにする
                </button>
                <button
                  onClick={() => startEdit('cardPayments', p.id)}
                  aria-label={`${p.name}の支払予定を編集`}
                >
                  編集
                </button>
                <button
                  onClick={() => remove('cardPayments', p.id)}
                  aria-label={`${p.name}の支払予定を削除`}
                >
                  削除
                </button>
              </div>
            ))
        )}
        <p className="hint">
          支払日以降に「支払い済みにする」を押すと、今日の支出として1回だけ記録します。過去の未払いも今月の見通しに含めます。未来の支払日ではこのボタンは使えません。
        </p>
      </section>
    </>
  )
}
