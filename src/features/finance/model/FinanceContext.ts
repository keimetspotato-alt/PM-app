import { createContext, useContext } from 'react'
import type { useFinanceModel } from './useFinanceModel'
export const FinanceContext = createContext<ReturnType<
  typeof useFinanceModel
> | null>(null)
export function useFinance() {
  const value = useContext(FinanceContext)
  if (!value) throw new Error('Finance provider missing')
  return value
}
