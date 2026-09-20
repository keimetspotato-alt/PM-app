import { emptyData, validData, withMonthlyItems } from '../domain/finance'
import type { Data } from '../domain/finance'
const KEY = 'pm-app.finance.v1'
export function loadFinance() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { data: emptyData(), error: '' }
    const parsed: unknown = JSON.parse(raw)
    if (validData(parsed)) return { data: withMonthlyItems(parsed), error: '' }
  } catch {
    /* keep existing storage intact */
  }
  return {
    data: emptyData(),
    error:
      '保存データを読み込めませんでした。自動保存を停止しています。バックアップを読み込んで復元してください。',
  }
}

export function saveFinance(data: Data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}
