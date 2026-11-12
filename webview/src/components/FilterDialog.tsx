import { useEffect, useState } from 'react'
import { createTranslator } from '../../../src/shared/i18n'
import {
  computeTimeRange,
  fromDatetimeLocalValue,
  granularityForRangeDays,
  toDatetimeLocalValue,
} from '../../../src/shared/time'
import type {
  DashboardFilters,
  DashboardViewModel,
  TimeGranularity,
} from '../../../src/shared/types'
import { post } from '../vscodeApi'
import { AlertIcon, CloseIcon } from './Icons'

const PRESETS = [1, 7, 14, 29] as const

const PRESET_LABEL_KEYS = {
  1: 'filter.day1',
  7: 'filter.day7',
  14: 'filter.day14',
  29: 'filter.day29',
} as const

interface FilterDialogProps {
  state: DashboardViewModel
  onClose: () => void
}

export function FilterDialog({ state, onClose }: FilterDialogProps) {
  const t = createTranslator(state.locale)
  const [presetDays, setPresetDays] = useState<number | null>(
    state.filters.presetDays
  )
  const [granularity, setGranularity] = useState<TimeGranularity>(
    state.filters.granularity
  )
  const [start, setStart] = useState(
    toDatetimeLocalValue(state.filters.startTimestamp)
  )
  const [end, setEnd] = useState(
    toDatetimeLocalValue(state.filters.endTimestamp)
  )
  const [username, setUsername] = useState(state.filters.username ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const selectPreset = (days: number) => {
    const range = computeTimeRange(days)
    setPresetDays(days)
    setGranularity(granularityForRangeDays(days))
    setStart(toDatetimeLocalValue(range.startTimestamp))
    setEnd(toDatetimeLocalValue(range.endTimestamp))
    setError(null)
  }

  const apply = () => {
    const startTimestamp = fromDatetimeLocalValue(start)
    const endTimestamp = fromDatetimeLocalValue(end)
    if (
      startTimestamp === null ||
      endTimestamp === null ||
      startTimestamp >= endTimestamp
    ) {
      setError(t('filter.invalidRange'))
      return
    }

    const filters: DashboardFilters = {
      presetDays,
      granularity,
      startTimestamp,
      endTimestamp,
    }
    const trimmedUsername = username.trim()
    if (state.profile?.isAdmin && trimmedUsername) {
      filters.username = trimmedUsername
    }
    post({ type: 'applyFilters', filters })
    onClose()
  }

  const reset = () => {
    const days = state.preferences.defaultDays
    const range = computeTimeRange(days)
    setPresetDays(days)
    setGranularity(state.preferences.defaultGranularity)
    setStart(toDatetimeLocalValue(range.startTimestamp))
    setEnd(toDatetimeLocalValue(range.endTimestamp))
    setUsername('')
    setError(null)
  }

  return (
    <div className='modal-backdrop' onMouseDown={onClose}>
      <div
        className='modal glass'
        role='dialog'
        aria-modal='true'
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className='modal-head'>
          <div>
            <h2>{t('filter.title')}</h2>
            <p className='muted'>{t('filter.description')}</p>
          </div>
          <button
            type='button'
            className='icon-button'
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <CloseIcon />
          </button>
        </header>

        <div className='modal-body'>
          <section className='filter-section'>
            <label className='filter-label'>{t('filter.quickRange')}</label>
            <div className='preset-row'>
              {PRESETS.map((days) => (
                <button
                  key={days}
                  type='button'
                  className={
                    presetDays === days ? 'preset-button active' : 'preset-button'
                  }
                  onClick={() => selectPreset(days)}
                >
                  {t(PRESET_LABEL_KEYS[days])}
                </button>
              ))}
            </div>
          </section>

          <div className='divider' />

          <section className='field-grid'>
            <div className='field'>
              <label htmlFor='filter-start'>{t('filter.start')}</label>
              <input
                id='filter-start'
                type='datetime-local'
                value={start}
                onChange={(event) => {
                  setStart(event.target.value)
                  setPresetDays(null)
                }}
              />
            </div>
            <div className='field'>
              <label htmlFor='filter-end'>{t('filter.end')}</label>
              <input
                id='filter-end'
                type='datetime-local'
                value={end}
                onChange={(event) => {
                  setEnd(event.target.value)
                  setPresetDays(null)
                }}
              />
            </div>
            <div className='field'>
              <label htmlFor='filter-granularity'>
                {t('filter.granularity')}
              </label>
              <select
                id='filter-granularity'
                value={granularity}
                onChange={(event) =>
                  setGranularity(event.target.value as TimeGranularity)
                }
              >
                <option value='hour'>{t('filter.hour')}</option>
                <option value='day'>{t('filter.day')}</option>
                <option value='week'>{t('filter.week')}</option>
              </select>
            </div>

            {state.profile?.isAdmin ? (
              <div className='field'>
                <label htmlFor='filter-username'>{t('filter.username')}</label>
                <input
                  id='filter-username'
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t('filter.usernamePlaceholder')}
                  autoComplete='off'
                  spellCheck={false}
                />
              </div>
            ) : null}
          </section>

          {error ? (
            <div className='inline-error'>
              <AlertIcon width={14} height={14} />
              <div>{error}</div>
            </div>
          ) : null}
        </div>

        <footer className='modal-foot'>
          <button type='button' className='outline-button' onClick={reset}>
            {t('common.reset')}
          </button>
          <button type='button' className='primary-button' onClick={apply}>
            {t('common.apply')}
          </button>
        </footer>
      </div>
    </div>
  )
}
