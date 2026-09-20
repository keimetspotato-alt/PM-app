import { useFinance } from '../model/FinanceContext'
import { today } from '../domain/finance'
export function FinanceDialogs() {
  const {
    data,
    editing,
    setEditing,
    editError,
    saveEdit,
    pending,
    setPending,
  } = useFinance()
  return (
    <>
      {editing && (
        <div
          className="confirmation"
          role="dialog"
          aria-modal="true"
          aria-label="登録内容を編集"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditing(null)
          }}
        >
          <div>
            <h2>登録内容を編集</h2>
            <form
              key={`${editing.collection}-${editing.id}`}
              onSubmit={saveEdit}
            >
              <label>
                名前・内容
                <input
                  autoFocus
                  name="name"
                  required
                  maxLength={editing.collection === 'cardPayments' ? 100 : 120}
                  defaultValue={editing.name}
                />
              </label>
              <label>
                金額（円）
                <input
                  name="amount"
                  type="number"
                  required
                  min="0"
                  max="1000000000000"
                  step="1"
                  defaultValue={editing.amount}
                />
              </label>
              {editing.date !== undefined && (
                <label>
                  {editing.collection === 'cardPayments' ? '支払日' : '記録日'}
                  <input
                    name="date"
                    type="date"
                    required
                    min={
                      editing.collection === 'transactions'
                        ? data.baseDate
                        : undefined
                    }
                    max={
                      editing.collection === 'transactions'
                        ? today()
                        : undefined
                    }
                    defaultValue={editing.date}
                  />
                </label>
              )}
              {editing.month !== undefined && (
                <label>
                  予定月
                  <input
                    name="month"
                    type="month"
                    required
                    defaultValue={editing.month}
                  />
                </label>
              )}
              {editing.kind !== undefined && (
                <label>
                  種類
                  <select name="kind" defaultValue={editing.kind}>
                    <option value="expense">支出</option>
                    <option value="income">収入</option>
                  </select>
                </label>
              )}
              {editError && <p role="alert">{editError}</p>}
              <div>
                <button type="button" onClick={() => setEditing(null)}>
                  キャンセル
                </button>
                <button className="action" type="submit">
                  変更を保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    </>
  )
}
