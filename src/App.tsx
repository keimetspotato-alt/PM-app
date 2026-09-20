import { FinanceWorkspace } from './features/finance/FinanceWorkspace'
import { FinanceContext } from './features/finance/model/FinanceContext'
import { useFinanceModel } from './features/finance/model/useFinanceModel'
export default function App() {
  const finance = useFinanceModel()
  return (
    <FinanceContext.Provider value={finance}>
      <FinanceWorkspace />
    </FinanceContext.Provider>
  )
}
