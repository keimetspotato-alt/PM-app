import { useFinance } from '../model/FinanceContext'
export function SettingsPage() {
  const { backup, restore } = useFinance()
  return (
    <>
      <section>
        <h2>データを手元に残す</h2>
        <p>
          入力内容は、この端末・このブラウザに保存します。サーバーへの送信や別端末との同期は行いません。
        </p>
        <p className="hint">
          ブラウザのデータ削除や利用するURLの変更で、保存内容が使えなくなる場合があります。定期的にバックアップを保管してください。バックアップには入力した金額や内容が含まれます。
        </p>
        <div className="backup">
          <button className="action" onClick={backup}>
            バックアップを書き出す
          </button>
          <label>
            バックアップを読み込む
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                void restore(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        </div>
        <p className="hint">
          登録した項目は「編集」から変更できます。基準日は収支の記録後には変更できません。
        </p>
      </section>
    </>
  )
}
