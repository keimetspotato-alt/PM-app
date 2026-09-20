import { MonthlyBudget } from '../components/MonthlyBudget'
import { useFinance } from '../model/FinanceContext'
import { withMonthlyItems } from '../domain/finance'
export function MonthlyBudgetPage() {
  const { data, setData } = useFinance()
  return (
    <MonthlyBudget
      items={withMonthlyItems(data).monthlyItems ?? []}
      onChange={(items) => setData((d) => withMonthlyItems(d, items))}
    />
  )
}
