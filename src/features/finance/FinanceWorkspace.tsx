import { ForecastPage } from './pages/ForecastPage'
import { AssetsPage } from './pages/AssetsPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { MonthlyBudgetPage } from './pages/MonthlyBudgetPage'
import { SettingsPage } from './pages/SettingsPage'
import { FinanceDialogs } from './components/FinanceDialogs'
import { financePages } from './navigation'
import { useFinance } from './model/FinanceContext'
import './finance.css'
export function FinanceWorkspace() {
  const { tab: selectedTab, setTab, saved, message, setMessage } = useFinance()
  const page = financePages.find((p) => p.id === selectedTab) ?? financePages[0]
  const tab = page.id
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
        <FinanceDialogs />
        <header>
          <div>
            <p className="eyebrow">PERSONAL FINANCE</p>
            <h1>{page.label}</h1>
            <p className="subtitle">{page.description}</p>
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
        <nav className="tabs" aria-label="家計簿のページ">
          {financePages.map((p) => (
            <button
              key={p.id}
              aria-current={tab === p.id ? 'page' : undefined}
              className={tab === p.id ? 'selected' : ''}
              onClick={() => setTab(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>
        {tab === 'forecast' && <ForecastPage />}
        {tab === 'assets' && <AssetsPage />}
        {tab === 'transactions' && <TransactionsPage />}
        {tab === 'budget' && <MonthlyBudgetPage />}
        {tab === 'settings' && <SettingsPage />}
        <footer>
          PM-app · 家計簿 MVP{' '}
          <span>あなたの暮らしを、少しずつ見える形に。</span>
        </footer>
      </main>
    </div>
  )
}
