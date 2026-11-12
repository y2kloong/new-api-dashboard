import { describe, expect, it } from 'vitest'
import { ApiError, normalizeBaseUrl } from './api'

describe('normalizeBaseUrl', () => {
  it('keeps an origin', () => {
    expect(normalizeBaseUrl('https://newapi.example.com')).toBe(
      'https://newapi.example.com'
    )
  })

  it('adds https when the scheme is missing', () => {
    expect(normalizeBaseUrl('newapi.example.com')).toBe(
      'https://newapi.example.com'
    )
  })

  it('strips a pasted dashboard URL', () => {
    expect(
      normalizeBaseUrl('https://newapi.example.com/dashboard/models')
    ).toBe('https://newapi.example.com')
    expect(normalizeBaseUrl('https://newapi.example.com/wallet')).toBe(
      'https://newapi.example.com'
    )
  })

  it('keeps a self-hosted sub path', () => {
    expect(normalizeBaseUrl('https://example.com/newapi/')).toBe(
      'https://example.com/newapi'
    )
  })

  it('rejects empty and non-http URLs', () => {
    expect(() => normalizeBaseUrl('  ')).toThrow(ApiError)
    expect(() => normalizeBaseUrl('ftp://example.com')).toThrow(ApiError)
  })
})
