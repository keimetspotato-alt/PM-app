export const scope = 'https://www.googleapis.com/auth/calendar.events.readonly'
type TokenResponse = {
  access_token?: string
  expires_in?: number
  scope?: string
  error?: string
}
export type GoogleOAuth = {
  initTokenClient(options: {
    client_id: string
    scope: string
    include_granted_scopes: boolean
    callback: (response: TokenResponse) => void
    error_callback: () => void
  }): { requestAccessToken(): void }
}
declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth } }
  }
}
let loading: Promise<GoogleOAuth> | undefined
export function loadGoogle(): Promise<GoogleOAuth> {
  if (window.google) return Promise.resolve(window.google.accounts.oauth2)
  if (loading) return loading
  loading = new Promise<GoogleOAuth>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    const timeout = window.setTimeout(fail, 15000)
    function fail() {
      window.clearTimeout(timeout)
      script.remove()
      reject(
        new Error(
          'Googleの接続機能を読み込めません。ネットワークを確認して再試行してください。',
        ),
      )
    }
    script.onerror = fail
    script.onload = () => {
      window.clearTimeout(timeout)
      if (window.google) resolve(window.google.accounts.oauth2)
      else fail()
    }
    document.head.append(script)
  }).catch((error) => {
    loading = undefined
    throw error
  })
  return loading
}
export type CalendarEvent = {
  id: string
  summary?: string
  location?: string
  status?: string
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
}
export function monthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error('表示月を選択してください。')
  const [year, m] = month.split('-').map(Number)
  return {
    timeMin: new Date(year, m - 1, 1).toISOString(),
    timeMax: new Date(year, m, 1).toISOString(),
  }
}
export class CalendarError extends Error {
  status: number
  constructor(status: number) {
    super(
      status === 401
        ? '接続の有効期限が切れました。再接続してください。'
        : status === 403
          ? 'アクセスできません。Calendar APIの有効化、テストユーザー、読み取り権限を確認してください。'
          : '予定を取得できません。時間をおいて再試行してください。',
    )
    this.status = status
  }
}
export async function listEvents(
  token: string,
  month: string,
  signal: AbortSignal,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    ...monthRange(month),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
    fields: 'items(id,summary,location,status,start,end),nextPageToken',
  })
  const events: CalendarEvent[] = []
  do {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal,
        cache: 'no-store',
      },
    )
    if (!response.ok) throw new CalendarError(response.status)
    const data = (await response.json()) as {
      items?: CalendarEvent[]
      nextPageToken?: string
    }
    events.push(...(data.items ?? []).filter((e) => e.status !== 'cancelled'))
    if (!data.nextPageToken) break
    params.set('pageToken', data.nextPageToken)
  } while (!signal.aborted)
  return events
}
export function eventTime(event: CalendarEvent) {
  if (event.start.date) {
    const end = event.end.date ? new Date(`${event.end.date}T00:00:00`) : null
    if (end) end.setDate(end.getDate() - 1)
    const last = end
      ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
      : event.start.date
    return `${event.start.date}${last > event.start.date ? ` 〜 ${last}` : ''} · 終日`
  }
  const format = (date?: string) =>
    date
      ? new Date(date).toLocaleString('ja-JP', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''
  return `${format(event.start.dateTime)} 〜 ${format(event.end.dateTime)}`
}
