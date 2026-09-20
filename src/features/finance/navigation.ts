export const financePages = [
  {
    id: 'forecast',
    label: '見通し',
    description: '計算条件と予定から、将来の残高を確認。',
  },
  { id: 'assets', label: '資産', description: '資産の基準残高を管理。' },
  {
    id: 'transactions',
    label: '収支・支払予定',
    description: '実際の入出金と、これからの支払いを管理。',
  },
  {
    id: 'budget',
    label: '毎月の内訳',
    description: '予測に使う毎月の収入・支出を分類別に設定。',
  },
  {
    id: 'settings',
    label: '設定',
    description: '保存方法とバックアップを管理。',
  },
] as const
export type FinancePageId = (typeof financePages)[number]['id']
