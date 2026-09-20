import './App.css'

function App() {
  return (
    <main className="shell">
      <p className="eyebrow">家計と、これから。</p>
      <h1>未来を見据える家計簿</h1>
      <p className="intro">日々の収支から、これからの暮らしを考える。</p>
      <section aria-labelledby="status">
        <span className="badge">開発準備</span>
        <h2 id="status">ここから、つくっていきましょう。</h2>
        <p>家計の記録と将来の収支シミュレーションを開発するための土台です。</p>
        <ul>
          <li>毎月の収入と支出の記録</li>
          <li>貯蓄と将来の残高の見通し</li>
          <li>大きな出費を含めた暮らしの計画</li>
        </ul>
        <p className="note">上記の機能はこれから実装します。</p>
      </section>
    </main>
  )
}

export default App
