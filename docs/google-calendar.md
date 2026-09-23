# Googleカレンダー接続

Google Identity Servicesのブラウザ用トークンモデルを使用します。メインカレンダーを月単位で読み取るMVPです。OAuthスコープは `https://www.googleapis.com/auth/calendar.events.readonly`。書き込み・タスクの予定化・バックグラウンド同期は行いません。

## 初回設定

1. Google Cloudでプロジェクトを選択し、Google Calendar APIを有効化。
2. Google Auth Platformでブランディングと対象ユーザーを設定。外部・テスト公開の場合は自分のGoogleアカウントをテストユーザーとして追加。
3. データアクセスに上記の読み取りスコープを設定。
4. ウェブアプリケーションのOAuthクライアントを作成。「承認済みのJavaScript生成元」に `http://127.0.0.1:5173` を登録。別ポート・localhost・公開URLを使用する場合は、その生成元を個別に登録。
5. アプリの「カレンダー」にクライアントIDを入力して「接続を準備する」、続いて「Googleに接続する」を押す。本人がGoogle画面で読み取りを許可する。

IDは任意で `.env.local` に `VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com` と設定可能です。変更後は開発サーバーを再起動します。クライアントIDは公開識別子です。シークレットは不要で、フロントエンドに入れてはいけません。APIキーとリダイレクトURIもこの実装では使いません。

## データとエラー

- トークンと予定はメモリだけに保持。localStorage、JSONバックアップ、ログには保存しません。
- 再読み込み・期限切れ後はボタンから再認可。自動再接続しません。
- 「接続を終了」は画面内のトークンと予定を消去します。Google側の許可取り消しはGoogleアカウントの接続管理で行います。
- ページネーションで全件取得し、繰り返し予定は展開。終日予定は日付のまま、終了日は排他的な日付から1日引いて表示します。時刻は端末のタイムゾーン。
- 月変更・切断時は古いリクエストを中止。403はAPI有効化・権限・テストユーザーを確認し、401は再接続します。
- 別の共有カレンダーの選択、予定作成・変更、通知は未実装。

## 検証範囲

APIを模擬した単体テストで月境界・終日・ページネーション・エラー・中止を確認。実Googleアカウントでの疎通はクライアントID設定と本人の認可後に確認が必要です。

公式資料：[トークンモデル](https://developers.google.com/identity/oauth2/web/guides/use-token-model)、[Calendar JavaScript quickstart](https://developers.google.com/workspace/calendar/api/quickstart/js)、[予定一覧API](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)。
