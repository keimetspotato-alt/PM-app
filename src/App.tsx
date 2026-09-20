import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  balance,
  emptyData,
  forecast,
  signed,
  today,
  validData,
} from './domain/finance'
import type { Data } from './domain/finance'
import './App.css'
const KEY = 'pm-app.finance.v1'
const yen = (n: number) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(
    n,
  )
function initial() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { data: emptyData(), error: '' }
    const parsed: unknown = JSON.parse(raw)
    if (validData(parsed)) return { data: parsed, error: '' }
  } catch {
    /* keep existing storage intact */
  }
  return {
    data: emptyData(),
    error:
      '保存データを読み込めませんでした。自動保存を停止しています。バックアップを読み込んで復元してください。',
  }
}
function App() {
  const [loaded] = useState(initial)
  const [data, setData] = useState<Data>(loaded.data)
  const [blocked, setBlocked] = useState(Boolean(loaded.error))
  const [message, setMessage] = useState(loaded.error)
  const [tab, setTab] = useState('overview')
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState<{
    text: string
    run: () => void
  } | null>(null)
  useEffect(() => {
    if (blocked) return
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
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
  function remove(collection: 'assets' | 'transactions' | 'plans', id: string) {
    setPending({
      text: 'この項目を削除しますか？',
      run: () =>
        setData((d) => ({
          ...d,
          [collection]: d[collection].filter((item) => item.id !== id),
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
          setData(next)
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
  return (
    <div className="layout">
      <aside>
        <a className="brand" href="#">
          PM<span> / </span>自分を整える
        </a>
        <p className="nav-label">WORKSPACE</p>
        <div className="active-nav">◉ 家計簿</div>
        <p className="future">
          カレンダー <small>準備中</small>
        </p>
        <p className="future">
          タスク管理 <small>準備中</small>
        </p>
        <p className="future">
          ビジョン管理 <small>準備中</small>
        </p>
        <div className="aside-bottom">
          小さな記録から、
          <br />
          これからの暮らしへ。
        </div>
      </aside>
      <main>
        {pending && (
          <div
            className="confirmation"
            role="alertdialog"
            aria-modal="true"
            aria-label="操作の確認"
          >
            <div>
              <p>{pending.text}</p>
              <button autoFocus onClick={() => setPending(null)}>
                キャンセル
              </button>
              <button
                className="action"
                onClick={() => {
                  pending.run()
                  setPending(null)
                }}
              >
                確定する
              </button>
            </div>
          </div>
        )}
        <header>
          <div>
            <p className="eyebrow">PERSONAL FINANCE</p>
            <h1>お金の見通し</h1>
            <p className="subtitle">いまを知って、これからを考える。</p>
          </div>
          <span className="save-status">
            {saved ? '● このブラウザに保存済み' : '○ 未保存'}
          </span>
        </header>
        {message && (
          <div className="notice" role="status">
            {message}
            <button onClick={() => setMessage('')} aria-label="通知を閉じる">
              ×
            </button>
          </div>
        )}
        <nav className="tabs" aria-label="家計簿の表示">
          {[
            ['overview', '見通し'],
            ['records', '資産・収支'],
            ['settings', '設定・バックアップ'],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-current={tab === id ? 'page' : undefined}
              className={tab === id ? 'selected' : ''}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === 'overview' && (
          <>
            <div className="stats">
              <article className="stat primary">
                <p>現在の資産合計</p>
                <strong>{yen(current)}</strong>
                <small>基準資産 ＋ 記録した収支</small>
              </article>
              <article className="stat">
                <p>毎月の収支見込み</p>
                <strong
                  className={data.income - data.expense < 0 ? 'negative' : ''}
                >
                  {yen(data.income - data.expense)}
                </strong>
                <small>
                  収入 {yen(data.income)} − 支出 {yen(data.expense)}
                </small>
              </article>
              <article className="stat">
                <p>{data.years}年後の残高</p>
                <strong className={last.balance < 0 ? 'negative' : ''}>
                  {yen(last.balance)}
                </strong>
                <small>{last.month.replace('-', '年')}月の見込み</small>
              </article>
            </div>
            <section>
              <div className="section-heading">
                <div>
                  <h2>資産のこれから</h2>
                  <p>現在の残高を起点に、翌月から月単位で計算</p>
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
                <p className="empty">
                  最初に「資産・収支」で現在の資産を登録しましょう。
                </p>
              )}
              <svg
                viewBox="0 0 760 220"
                role="img"
                aria-label={`${data.years}年間の資産推移。現在${yen(current)}、将来${yen(last.balance)}`}
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
                  現在
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
                <label>
                  毎月の手取り収入（円）
                  <input
                    type="number"
                    min="0"
                    max="1000000000000"
                    step="1"
                    value={data.income}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (Number.isSafeInteger(n) && n >= 0 && n <= 1e12)
                        update({ income: n })
                    }}
                  />
                </label>
                <label>
                  毎月の支出（円）
                  <input
                    type="number"
                    min="0"
                    max="1000000000000"
                    step="1"
                    value={data.expense}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (Number.isSafeInteger(n) && n >= 0 && n <= 1e12)
                        update({ expense: n })
                    }}
                  />
                </label>
              </div>
              <p className="hint">
                毎月同じ収支が続く単純計算です。運用益・物価変動・税金の追加計算は含みません。記録済みの収支は現在残高にのみ反映し、毎月の見込みとは別に扱います。
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
                  <input
                    type="month"
                    name="month"
                    min={points[1].month}
                    required
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
        )}
        {tab === 'records' && (
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
                <p className="empty">
                  資産を追加すると、残高の計算が始まります。
                </p>
              ) : (
                data.assets.map((a) => (
                  <div className="row" key={a.id}>
                    <b>{a.name}</b>
                    <strong>{yen(a.amount)}</strong>
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
            <section>
              <h2>収入・支出を記録</h2>
              <p className="hint">
                今月の記録：収入{' '}
                {yen(
                  actual
                    .filter((t) => t.kind === 'income')
                    .reduce((s, t) => s + t.amount, 0),
                )}{' '}
                ／ 支出{' '}
                {yen(
                  actual
                    .filter((t) => t.kind === 'expense')
                    .reduce((s, t) => s + t.amount, 0),
                )}
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
                <label>
                  種類
                  <select name="kind">
                    <option value="expense">支出</option>
                    <option value="income">収入</option>
                  </select>
                </label>
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
                          {t.date} · {t.kind === 'income' ? '収入' : '支出'}
                        </small>
                      </div>
                      <strong
                        className={
                          t.kind === 'expense' ? 'negative' : 'positive'
                        }
                      >
                        {yen(signed(t))}
                      </strong>
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
        )}
        {tab === 'settings' && (
          <section>
            <h2>データを手元に残す</h2>
            <p>
              入力内容は、この端末・このブラウザに保存します。サーバーへの送信や別端末との同期は行いません。
            </p>
            <p className="hint">
              ブラウザのデータ削除や利用するURLの変更で、保存内容が使えなくなる場合があります。定期的にバックアップを保管してください。バックアップには入力した金額や内容が含まれます。
            </p>
            <div className="backup">
              <button className="action" onClick={backup}>
                バックアップを書き出す
              </button>
              <label>
                バックアップを読み込む
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    void restore(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <p className="hint">
              誤った項目は「削除」して再登録できます。基準日は収支の記録後には変更できません。
            </p>
          </section>
        )}
        <footer>
          PM-app · 家計簿 MVP{' '}
          <span>あなたの暮らしを、少しずつ見える形に。</span>
        </footer>
      </main>
    </div>
  )
}
export default App
