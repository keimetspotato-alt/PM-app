import { useFinance } from '../model/FinanceContext'
import { yen } from '../../../shared/format'
export function BillBudgetFields({ selected = [] }: { selected?: string[] }) {
  const { data } = useFinance()
  return (
    <fieldset className="bill-budget">
      <legend>この請求で確定する月額予算（任意）</legend>
      <p className="hint">
        選んだ内訳の「支払月1か月分」を予測から外し、代わりに請求額を使います。その月の対象予算が全て確定した場合だけ選んでください。一部だけの請求には使わず、内訳を分けてください。
      </p>
      {(data.monthlyItems ?? [])
        .filter((i) => i.kind === 'expense')
        .map((i) => (
          <label className="check-label" key={i.id}>
            <input
              type="checkbox"
              name="coveredMonthlyItemIds"
              value={i.id}
              defaultChecked={selected.includes(i.id)}
            />
            {i.name} · {i.category} · {yen(i.amount)} / 月
          </label>
        ))}
      {!(data.monthlyItems ?? []).some((i) => i.kind === 'expense') && (
        <p className="hint">毎月の内訳を設定すると選べます。</p>
      )}
    </fieldset>
  )
}
