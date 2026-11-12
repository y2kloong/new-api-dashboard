import type { QuotaRow } from '../../shared/types'

/** Local midnight so hour/day/week bucketing is deterministic in any timezone. */
export const baseTimestamp = Math.floor(
  new Date(2026, 0, 5, 0, 0, 0, 0).getTime() / 1000
)

export function makeQuotaRows(): QuotaRow[] {
  return [
    {
      created_at: baseTimestamp,
      model_name: 'deepseek-flash',
      count: 10,
      quota: 1000,
      token_used: 2000,
      cache_read_tokens: 500,
      cache_creation_tokens: 100,
    },
    {
      created_at: baseTimestamp + 600,
      model_name: 'deepseek-flash',
      count: 5,
      quota: 500,
      token_used: 1000,
      cache_read_tokens: 200,
      cache_creation_tokens: 0,
    },
    {
      created_at: baseTimestamp + 3600,
      model_name: 'gpt-5',
      count: 2,
      quota: 2000,
      token_used: 4000,
      cache_read_tokens: 300,
      cache_creation_tokens: 50,
    },
    {
      created_at: baseTimestamp + 7200,
      model_name: '',
      count: 1,
      quota: 250,
      token_used: 500,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
    },
  ]
}
