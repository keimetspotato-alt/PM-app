import { FinanceWorkspace } from './features/finance/FinanceWorkspace'
import { FinanceContext } from './features/finance/model/FinanceContext'
import { useFinanceModel } from './features/finance/model/useFinanceModel'
import { useState } from 'react'
import { TasksWorkspace } from './features/tasks/TasksWorkspace'
import './shared/workspace.css'
export default function App() {
  const finance = useFinanceModel()
  const [workspace, setWorkspace] = useState<'finance' | 'tasks'>('finance')
  return (
    <FinanceContext.Provider value={finance}>
      <div className="layout">
        <aside>
          <a className="brand" href="#" onClick={() => setWorkspace('finance')}>
            PM<span> / </span>自分を整える
          </a>
          <p className="nav-label">WORKSPACE</p>
          <nav className="workspace-nav" aria-label="ワークスペース">
            <button
              aria-current={workspace === 'finance' ? 'page' : undefined}
              onClick={() => setWorkspace('finance')}
            >
              家計簿
            </button>
            <button
              aria-current={workspace === 'tasks' ? 'page' : undefined}
              onClick={() => setWorkspace('tasks')}
            >
              タスク管理
            </button>
          </nav>
          <p className="future">
            カレンダー <small>準備中</small>
          </p>
          <p className="future">
            ビジョン管理 <small>準備中</small>
          </p>
        </aside>
        <div hidden={workspace !== 'finance'}>
          <FinanceWorkspace />
        </div>
        <div hidden={workspace !== 'tasks'}>
          <TasksWorkspace />
        </div>
      </div>
    </FinanceContext.Provider>
  )
}
