import { useEffect, useRef, useState } from 'react'
import {
  CalendarError,
  eventTime,
  listEvents,
  loadGoogle,
  scope,
  type CalendarEvent,
  type GoogleOAuth,
} from './googleCalendar'
export function CalendarWorkspace() {
  const [clientId, setClientId] = useState<string>(
    import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  )
  const [google, setGoogle] = useState<GoogleOAuth | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [session, setSession] = useState<{
    token: string
    expires: number
  } | null>(null)
  const now = new Date()
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  )
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const attempt = useRef(0)
  useEffect(() => {
    if (!session) return
    const timer = window.setTimeout(
      () => {
        setSession(null)
        setEvents([])
        setLoaded(false)
        setMessage('接続の有効期限が切れました。再接続してください。')
      },
      Math.max(0, session.expires - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [session])
  useEffect(() => {
    if (!session) return
    const controller = new AbortController()
    listEvents(session.token, month, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setEvents(items)
          setLoaded(true)
          setBusy(false)
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setBusy(false)
        setLoaded(false)
        setEvents([])
        setMessage(
          error instanceof CalendarError
            ? error.message
            : '取得に失敗しました。ネットワークと表示月を確認してください。',
        )
        if (error instanceof CalendarError && error.status === 401)
          setSession(null)
      })
    return () => controller.abort()
  }, [session, month, refresh])
  function connect() {
    if (!google) return
    const current = ++attempt.current
    setConnecting(true)
    setMessage('')
    google
      .initTokenClient({
        client_id: clientId.trim(),
        scope,
        include_granted_scopes: false,
        callback: (response) => {
          if (current !== attempt.current) return
          setConnecting(false)
          if (
            response.error ||
            !response.access_token ||
            !response.scope?.split(' ').includes(scope)
          ) {
            setMessage(
              '予定の読み取りが許可されませんでした。接続をやり直してください。',
            )
            return
          }
          const seconds = Number(response.expires_in)
          if (!Number.isFinite(seconds) || seconds <= 0) {
            setMessage('接続情報を確認できません。再接続してください。')
            return
          }
          setBusy(true)
          setLoaded(false)
          setEvents([])
          setSession({
            token: response.access_token,
            expires: Date.now() + seconds * 1000,
          })
        },
        error_callback: () => {
          if (current === attempt.current) {
            setConnecting(false)
            setMessage(
              '接続を完了できませんでした。ポップアップを許可して再試行してください。',
            )
          }
        },
      })
      .requestAccessToken()
  }
  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">PERSONAL CALENDAR</p>
          <h1>カレンダー</h1>
          <p className="subtitle">Googleカレンダーの予定を、ここで確認。</p>
        </div>
        <span className="save-status">
          {session ? 'Googleに接続中' : '未接続'}
        </span>
      </header>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <section>
        <h2>Googleカレンダーとの接続</h2>
        <p className="hint">
          メインカレンダーの予定を読み取ります。予定の作成・変更は行いません。予定とアクセストークンは保存せず、画面を再読み込みすると再接続が必要です。
        </p>
        {!session && (
          <>
            <label>
              OAuthクライアントID
              <input
                value={clientId}
                disabled={connecting}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="…apps.googleusercontent.com"
              />
            </label>
            <p className="hint">
              Google
              Cloudで作成する「ウェブアプリケーション」のIDです。クライアントシークレットは入力しないでください。
            </p>
            {!google ? (
              <button
                disabled={
                  preparing ||
                  !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(
                    clientId.trim(),
                  )
                }
                onClick={async () => {
                  setPreparing(true)
                  setMessage('')
                  try {
                    setGoogle(await loadGoogle())
                  } catch (error) {
                    setMessage((error as Error).message)
                  } finally {
                    setPreparing(false)
                  }
                }}
              >
                {preparing ? '準備中…' : '接続を準備する'}
              </button>
            ) : (
              <button
                className="action"
                disabled={
                  connecting ||
                  !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(
                    clientId.trim(),
                  )
                }
                onClick={connect}
              >
                {connecting
                  ? 'Googleで許可を待っています…'
                  : 'Googleに接続する'}
              </button>
            )}
          </>
        )}
        {(session || connecting) && (
          <button
            onClick={() => {
              attempt.current++
              setSession(null)
              setConnecting(false)
              setEvents([])
              setLoaded(false)
              setBusy(false)
              setMessage(
                'この画面の接続を終了しました。Google側のアクセス許可はアカウント設定で解除できます。',
              )
            }}
          >
            接続を終了
          </button>
        )}
        <details>
          <summary>初回のGoogle設定手順</summary>
          <ol>
            <li>
              <a
                href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                target="_blank"
                rel="noreferrer"
              >
                Google Cloud
              </a>
              でプロジェクトを作成・選択し、Google Calendar APIを有効にします。
            </li>
            <li>
              Google Auth
              Platformでアプリ名・連絡先を設定し、テスト公開の場合は自分のGoogleアカウントをテストユーザーに追加します。
            </li>
            <li>
              データアクセスに calendar.events.readonly
              を設定し、ウェブアプリケーションのOAuthクライアントを作成します。
            </li>
            <li>
              「承認済みのJavaScript生成元」に{' '}
              <code>{window.location.origin}</code>{' '}
              を登録します。パスや末尾のスラッシュは付けません。
            </li>
            <li>
              発行されたクライアントIDを上の欄へ入力し、接続して読み取りを許可します。
            </li>
          </ol>
          <p className="hint">
            この接続方式ではAPIキー・クライアントシークレット・リダイレクトURIは使いません。
          </p>
        </details>
        <p className="hint">
          <a
            href="https://myaccount.google.com/connections"
            target="_blank"
            rel="noreferrer"
          >
            Google側のアクセス許可を管理
          </a>
        </p>
      </section>
      <section>
        <h2>予定一覧</h2>
        <div className="task-filters">
          <label>
            表示月
            <input
              type="month"
              value={month}
              onChange={(e) => {
                if (e.target.value) {
                  setMonth(e.target.value)
                  setEvents([])
                  setLoaded(false)
                  setBusy(Boolean(session))
                  setMessage('')
                }
              }}
            />
          </label>
          <button
            disabled={!session || busy}
            onClick={() => {
              setBusy(true)
              setLoaded(false)
              setEvents([])
              setMessage('')
              setRefresh((n) => n + 1)
            }}
          >
            予定を更新
          </button>
        </div>
        <p className="hint">
          時刻はこの端末のタイムゾーン（
          {Intl.DateTimeFormat().resolvedOptions().timeZone}）で表示します。
        </p>
        {!session ? (
          <p className="empty">Googleに接続すると予定が表示されます。</p>
        ) : busy ? (
          <p role="status">予定を読み込み中…</p>
        ) : loaded && events.length === 0 ? (
          <p className="empty">この月の予定はありません。</p>
        ) : (
          events.map((event) => (
            <div className="row" key={event.id}>
              <div>
                <b>{event.summary || '（タイトルなし）'}</b>
                <small>{eventTime(event)}</small>
                {event.location && <small>{event.location}</small>}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  )
}
