/** window.localStorage, or undefined where reading it throws (private mode, sandboxed frames). */
export function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage ?? undefined
  } catch {
    return undefined
  }
}
