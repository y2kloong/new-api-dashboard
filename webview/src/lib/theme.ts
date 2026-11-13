import type { ThemeMode, ThemeStyle } from '../../../src/shared/types'

export const THEME_CYCLE: ThemeMode[] = ['auto', 'dark', 'light']

export function nextThemeMode(current: ThemeMode): ThemeMode {
  const index = THEME_CYCLE.indexOf(current)
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length] ?? 'auto'
}

/** Render order of the skin pickers: default first, newest last. */
export const THEME_STYLES: ThemeStyle[] = ['shadcn', 'glass', 'pixel']

export const THEME_STYLE_LABEL_KEYS = {
  glass: 'style.glass',
  pixel: 'style.pixel',
  shadcn: 'style.shadcn',
} as const
