import { useEffect, useState } from 'react'
import { createTranslator } from '../../../src/shared/i18n'
import {
  computeTimeRange,
  granularityForRangeDays,
} from '../../../src/shared/time'
import type {
  DashboardFilters,
  DashboardViewModel,
  TimeGranularity,
} from '../../../src/shared/types'
import { post } from '../vscodeApi'
import { DateTimePicker } from './ui/date-time-picker'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
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
  const [startTimestamp, setStartTimestamp] = useState(
    state.filters.startTimestamp
  )
  const [endTimestamp, setEndTimestamp] = useState(state.filters.endTimestamp)
  const [username, setUsername] = useState(state.filters.username ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      // A date popover or select menu is a layer above the dialog: its own
      // Escape handling closes the layer and this guard keeps the dialog open.
      const activeElement = document.activeElement
      if (
        activeElement instanceof Element &&
        activeElement.closest(
          '.ui-popover, .ui-select-content, [data-radix-popper-content-wrapper]'
        )
      ) {
        return
      }
      onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const selectPreset = (days: number) => {
    const range = computeTimeRange(days)
    setPresetDays(days)
    setGranularity(granularityForRangeDays(days))
    setStartTimestamp(range.startTimestamp)
    setEndTimestamp(range.endTimestamp)
    setError(null)
  }

  const apply = () => {
    if (startTimestamp >= endTimestamp) {
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
    setStartTimestamp(range.startTimestamp)
    setEndTimestamp(range.endTimestamp)
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
              <DateTimePicker
                id='filter-start'
                locale={state.locale}
                value={startTimestamp}
                onChange={(next) => {
                  setStartTimestamp(next)
                  setPresetDays(null)
                }}
              />
            </div>
            <div className='field'>
              <label htmlFor='filter-end'>{t('filter.end')}</label>
              <DateTimePicker
                id='filter-end'
                locale={state.locale}
                value={endTimestamp}
                onChange={(next) => {
                  setEndTimestamp(next)
                  setPresetDays(null)
                }}
              />
            </div>
            <div className='field'>
              <label htmlFor='filter-granularity'>
                {t('filter.granularity')}
              </label>
              <Select
                value={granularity}
                onValueChange={(next) =>
                  setGranularity(next as TimeGranularity)
                }
              >
                <SelectTrigger id='filter-granularity'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='hour'>{t('filter.hour')}</SelectItem>
                  <SelectItem value='day'>{t('filter.day')}</SelectItem>
                  <SelectItem value='week'>{t('filter.week')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {state.profile?.isAdmin ? (
              <div className='field'>
                <label htmlFor='filter-username'>{t('filter.username')}</label>
                <Input
                  id='filter-username'
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
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
