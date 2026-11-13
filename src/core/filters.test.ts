import { describe, expect, it } from 'vitest'
import {
  buildDefaultPreferences,
  isThemeStyle,
  sanitizePreferences,
} from './filters'

const defaults = buildDefaultPreferences()

describe('isThemeStyle', () => {
  it('accepts every shipped skin', () => {
    expect(isThemeStyle('glass')).toBe(true)
    expect(isThemeStyle('pixel')).toBe(true)
    expect(isThemeStyle('shadcn')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isThemeStyle('retro')).toBe(false)
    expect(isThemeStyle(undefined)).toBe(false)
    expect(isThemeStyle({ style: 'pixel' })).toBe(false)
  })
})

describe('buildDefaultPreferences', () => {
  it('defaults to the glass skin', () => {
    expect(defaults.themeStyle).toBe('glass')
  })
})

describe('sanitizePreferences', () => {
  it('keeps a valid theme style', () => {
    expect(
      sanitizePreferences({ themeStyle: 'pixel' }, defaults).themeStyle
    ).toBe('pixel')
    expect(
      sanitizePreferences({ themeStyle: 'shadcn' }, defaults).themeStyle
    ).toBe('shadcn')
  })

  it('falls back when the theme style is missing', () => {
    expect(sanitizePreferences({}, defaults).themeStyle).toBe('glass')
  })

  it('falls back when the webview sends an unknown theme style', () => {
    const sanitized = sanitizePreferences(
      { themeStyle: 'vaporwave' as never },
      defaults
    )
    expect(sanitized.themeStyle).toBe('glass')
  })

  it('does not let a theme style patch reset other preferences', () => {
    const current = { ...defaults, defaultDays: 7, themeMode: 'light' as const }
    const sanitized = sanitizePreferences({ themeStyle: 'pixel' }, current)
    expect(sanitized.defaultDays).toBe(7)
    expect(sanitized.themeMode).toBe('light')
    expect(sanitized.themeStyle).toBe('pixel')
  })
})
