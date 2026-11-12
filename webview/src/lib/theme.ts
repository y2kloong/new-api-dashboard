import type { ThemeMode } from '../../../src/shared/types'

export const THEME_CYCLE: ThemeMode[] = ['auto', 'dark', 'light']

export function nextThemeMode(current: ThemeMode): ThemeMode {
  const index = THEME_CYCLE.indexOf(current)
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length] ?? 'auto'
}
