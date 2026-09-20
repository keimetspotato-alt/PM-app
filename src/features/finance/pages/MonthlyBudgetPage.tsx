import { MonthlyBudget } from '../components/MonthlyBudget'
import { useFinance } from '../model/FinanceContext'
import { withMonthlyItems, validData } from '../domain/finance'
export function MonthlyBudgetPage() {
  const { data, setData, setMessage } = useFinance()
  return (
    <MonthlyBudget
      items={withMonthlyItems(data).monthlyItems ?? []}
      onChange={(items) => {
        const next = withMonthlyItems(data, items)
        if (!validData(next)) {
          setMessage(
            '請求に紐づく予算は削除・収入へ変更できません。先に請求の対応を外してください。',
          )
          return false
        }
        setData(next)
        return true
      }}
    />
  )
}
