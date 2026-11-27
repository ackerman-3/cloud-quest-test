import { KEY_PREFIX } from './env'
// 새 버전 확인 — 아이폰 홈 화면 앱은 내렸다 다시 열면 예전 화면을 그대로 이어서 보여 준다.
// 앱이 다시 보일 때 서버의 version.json을 확인해, 새 버전이 배포됐으면 알려 준다.

declare const __BUILD__: string
export const BUILD = __BUILD__

const TRIED_KEY = KEY_PREFIX + 'cloud-quest-update-tried'

/** 서버에 새 버전이 있으면 그 버전 값을, 없거나 확인할 수 없으면 null */
export async function checkUpdate(): Promise<string | null> {
  if (import.meta.env.DEV || !/^https?:$/.test(location.protocol)) return null
  try {
    const r = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return null
    const { v } = (await r.json()) as { v?: string }
    return v && v !== BUILD ? v : null
  } catch {
    return null
  }
}

/** 새 버전으로 새로고침. 주소에 버전을 붙여 캐시된 예전 페이지를 피하고, 같은 버전으로는 한 번만 시도한다 */
export function applyUpdate(v: string) {
  try {
    if (sessionStorage.getItem(TRIED_KEY) === v) return
    sessionStorage.setItem(TRIED_KEY, v)
  } catch {
    /* noop */
  }
  location.replace(`${location.pathname}?v=${v}`)
}
