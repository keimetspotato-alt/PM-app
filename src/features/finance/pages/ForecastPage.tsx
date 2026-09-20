import { useFinance } from '../model/FinanceContext'
import { yen } from '../../../shared/format'
export function ForecastPage() {
  const {
    data,
    setTab,
    points,
    current,
    last,
    deficit,
    targetMonths,
    targetBalance,
    max,
    y,
    line,
    update,
  } = useFinance()
  return (
    <>
      <div className="stats">
        <article className="stat primary">
          <p>現在の資産合計</p>
          <strong>{yen(current)}</strong>
          <small>現金・預金の残高（カード利用時は減算しません）</small>
        </article>
        <article className="stat">
          <p>毎月の収支見込み</p>
          <strong className={data.income - data.expense < 0 ? 'negative' : ''}>
            {yen(data.income - data.expense)}
          </strong>
          <small>
            収入 {yen(data.income)} − 支出 {yen(data.expense)}
          </small>
        </article>
        <article className="stat">
          <label>
            何か月後の残高を見ますか？
            <input
              type="number"
              min="1"
              max="360"
              step="1"
              value={targetMonths}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (Number.isInteger(n) && n >= 1 && n <= 360)
                  update({ targetMonths: n })
              }}
            />
          </label>
          <p style={{ marginTop: 12 }}>{targetMonths}か月後の残高</p>
          <strong
            className={targetBalance.balance < 0 ? 'negative' : ''}
            aria-live="polite"
          >
            {yen(targetBalance.balance)}
          </strong>
          <small>
            {targetBalance.month.replace('-', '年')}
            月末の見込み（1〜360か月）
          </small>
        </article>
      </div>
      <section>
        <div className="section-heading">
          <div>
            <h2>資産のこれから</h2>
            <p>今月までのクレカ未払い分を差し引き、翌月から月単位で計算</p>
          </div>
          <label>
            期間
            <select
              value={data.years}
              onChange={(e) => update({ years: Number(e.target.value) })}
            >
              {[1, 3, 5, 10, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}年
                </option>
              ))}
            </select>
          </label>
        </div>
        {data.assets.length === 0 && (
          <p className="empty">最初に「資産」で現在の資産を登録しましょう。</p>
        )}
        <svg
          viewBox="0 0 760 220"
          role="img"
          aria-label={`${data.years}年間の資産推移。今月の未払い反映後${yen(points[0].balance)}、将来${yen(last.balance)}`}
        >
          <line
            x1="40"
            x2="720"
            y1={y(0)}
            y2={y(0)}
            stroke="#ccd5d3"
            strokeDasharray="4 4"
          />
          <polyline
            points={line}
            fill="none"
            stroke="#247d69"
            strokeWidth="3"
          />
          <circle cx="720" cy={y(last.balance)} r="5" fill="#247d69" />
          <text x="40" y="210">
            今月末
          </text>
          <text x="660" y="210">
            {data.years}年後
          </text>
          <text x="40" y="18">
            最高 {yen(max)}
          </text>
        </svg>
        {deficit && (
          <p className="warning">
            {deficit.month}に残高がマイナスになる見込みです。
          </p>
        )}
        <div className="assumptions">
          <div>
            毎月の手取り収入
            <strong style={{ display: 'block' }}>{yen(data.income)}</strong>
          </div>
          <div>
            毎月の支出
            <strong style={{ display: 'block' }}>{yen(data.expense)}</strong>
          </div>
        </div>
        <button onClick={() => setTab('budget')}>毎月の内訳を設定</button>
        <p className="hint">
          毎月同じ収支が続く単純計算です。運用益・物価変動・税金の追加計算は含みません。カード利用は引き落とし時に残高へ反映します。請求に対応づけた月額予算は、その支払月のみ請求額へ置き換えます。未対応の予算・臨時支出との重複は自動判定しません。
        </p>
        <details>
          <summary>年ごとの残高を見る</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>時点</th>
                  <th>残高</th>
                </tr>
              </thead>
              <tbody>
                {points
                  .filter((_, i) => i % 12 === 0)
                  .map((p) => (
                    <tr key={p.month}>
                      <td>{p.month}</td>
                      <td>{yen(p.balance)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </>
  )
}
