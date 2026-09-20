import { TransactionFields } from './TransactionFields'
import { useFinance } from '../model/FinanceContext'
import { yen } from '../../../shared/format'
import { today, signed, expenseTotalForMonth } from '../domain/finance'
export function TransactionRecords() {
  const { data, startEdit, actual, add, remove } = useFinance()
  return (
    <>
      <section>
        <h2>収入・支出を記録</h2>
        <p className="hint">
          今月の記録：収入{' '}
          {yen(
            actual
              .filter((t) => t.kind === 'income')
              .reduce((s, t) => s + t.amount, 0),
          )}{' '}
          ／ 支出 {yen(expenseTotalForMonth(data, today().slice(0, 7)))}
        </p>
        <p className="hint">
          集計にはカード利用と、引き落とし済み請求の内訳未登録分を含みます。
        </p>
        <p className="hint">
          カード払いは利用日の支出として記録します。残高は引き落とし済みにした時だけ減ります。以前の記録は残高に反映済みとして維持しています。カード利用分だった場合は「編集」で支払方法と請求を指定してください。
        </p>
        <form onSubmit={(e) => add(e, 'transaction')}>
          <label>
            日付
            <input
              type="date"
              name="date"
              min={data.baseDate}
              max={today()}
              defaultValue={today()}
              required
            />
          </label>
          <TransactionFields />
          <label>
            内容
            <input
              name="name"
              required
              maxLength={120}
              placeholder="例：食費"
            />
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
          <button className="action">記録</button>
        </form>
        {data.transactions.length === 0 ? (
          <p className="empty">記録した収支がここに並びます。</p>
        ) : (
          data.transactions
            .toSorted((a, b) => b.date.localeCompare(a.date))
            .map((t) => (
              <div className="row" key={t.id}>
                <div>
                  <b>{t.name}</b>
                  <small>
                    {t.date} · {t.kind === 'income' ? '収入' : '支出'} ·{' '}
                    {t.category ?? '未分類'} ·{' '}
                    {t.paymentMethod === 'card'
                      ? 'クレカ（利用）'
                      : t.paymentMethod === 'bank'
                        ? '銀行'
                        : t.paymentMethod === 'cash'
                          ? '現金'
                          : '現金・銀行（既存記録）'}
                  </small>
                </div>
                <strong
                  className={t.kind === 'expense' ? 'negative' : 'positive'}
                >
                  {yen(signed(t))}
                </strong>
                <button
                  onClick={() => startEdit('transactions', t.id)}
                  aria-label={`${t.name}を編集`}
                >
                  編集
                </button>
                <button
                  onClick={() => remove('transactions', t.id)}
                  aria-label={`${t.name}を削除`}
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
