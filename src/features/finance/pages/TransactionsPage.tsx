import { TransactionRecords } from '../components/TransactionRecords'
import { CardPayments } from '../components/CardPayments'
import { PlannedExpenses } from '../components/PlannedExpenses'
export function TransactionsPage() {
  return (
    <>
      <TransactionRecords />
      <CardPayments />
      <PlannedExpenses />
    </>
  )
}
