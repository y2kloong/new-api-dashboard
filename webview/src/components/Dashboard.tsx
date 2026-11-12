import { useState } from 'react'
import { createTranslator } from '../../../src/shared/i18n'
import { bucketLabel } from '../../../src/shared/time'
import type { DashboardViewModel } from '../../../src/shared/types'
import { post } from '../vscodeApi'
import { ModelChartCard, QuotaChartCard } from './ChartCards'
import { FilterDialog } from './FilterDialog'
import { Header } from './Header'
import { AlertIcon, BarChartIcon, FilterIcon, GaugeIcon } from './Icons'
import { StatsGrid } from './StatsGrid'
import { SubscriptionSection } from './Subscription'

function ErrorBanner({ state }: { state: DashboardViewModel }) {
  const t = createTranslator(state.locale)
  if (!state.error) return null
  return (
    <div className='banner error'>
      <AlertIcon width={16} height={16} />
      <div className='banner-text'>
        <div>{state.error.message}</div>
        {state.error.hint ? (
          <div className='banner-hint'>{state.error.hint}</div>
        ) : null}
      </div>
      <button
        type='button'
        className='outline-button'
        onClick={() => post({ type: 'refresh' })}
      >
        {t('common.retry')}
      </button>
    </div>
  )
}

function DataExportNotice({ state }: { state: DashboardViewModel }) {
  const t = createTranslator(state.locale)
  if (!state.dataExportDisabled) return null
  return (
    <div className='banner warning'>
      <AlertIcon width={16} height={16} />
      <div className='banner-text'>
        <div>{t('error.dataExportDisabled')}</div>
        <div className='banner-hint'>{t('error.dataExportHint')}</div>
      </div>
    </div>
  )
}

function PerformanceStrip({ state }: { state: DashboardViewModel }) {
  const t = createTranslator(state.locale)
  const performance = state.performance
  if (!performance) return null

  return (
    <section className='panel glass perf-strip'>
      <div className='perf-title'>
        <span className='panel-icon tone-success'>
          <GaugeIcon width={14} height={14} />
        </span>
        <span>{t('performance.title')}</span>
      </div>
      <div className='perf-metrics'>
        <span className='perf-metric'>
          <em>{t('performance.successRate')}</em>
          <b>{performance.successRateText}</b>
        </span>
        <span className='perf-metric'>
          <em>{t('performance.latency')}</em>
          <b>{performance.latencyText}</b>
        </span>
        <span className='perf-metric'>
          <em>{t('performance.throughput')}</em>
          <b>{performance.throughputText}</b>
        </span>
      </div>
      <div className='perf-models'>
        {performance.models.map((model) => (
          <span className='model-chip' key={model.name}>
            <span className='mono model-name'>{model.name}</span>
            <i className={`rate-dot level-${model.level}`} />
            <b>{model.successRateText}</b>
          </span>
        ))}
      </div>
    </section>
  )
}

function buildFilterSummary(state: DashboardViewModel): string {
  const t = createTranslator(state.locale)
  const { filters } = state
  const presetKey =
    filters.presetDays === 1
      ? 'filter.day1'
      : filters.presetDays === 7
        ? 'filter.day7'
        : filters.presetDays === 14
          ? 'filter.day14'
          : filters.presetDays === 29
            ? 'filter.day29'
            : null
  const rangeLabel = presetKey
    ? t(presetKey)
    : `${bucketLabel(filters.startTimestamp, 'hour')} ~ ${bucketLabel(
        filters.endTimestamp,
        'hour'
      )}`
  const granularityLabel =
    filters.granularity === 'hour'
      ? t('filter.hour')
      : filters.granularity === 'day'
        ? t('filter.day')
        : t('filter.week')

  const parts = [rangeLabel, granularityLabel]
  if (filters.username) parts.push(`@${filters.username}`)
  return parts.join(' · ')
}

function AnalyticsSection({
  state,
  onOpenFilters,
}: {
  state: DashboardViewModel
  onOpenFilters: () => void
}) {
  const t = createTranslator(state.locale)

  return (
    <section
      className='analytics-section panel glass'
      aria-label={t('analytics.title')}
    >
      <header className='analytics-head'>
        <div className='analytics-heading'>
          <span className='panel-icon tone-info'>
            <BarChartIcon width={15} height={15} />
          </span>
          <div className='analytics-title-group'>
            <h2 className='analytics-title'>{t('analytics.title')}</h2>
            <div className='analytics-summary'>{buildFilterSummary(state)}</div>
          </div>
        </div>
        <div className='analytics-actions'>
          <button
            type='button'
            className='outline-button'
            onClick={onOpenFilters}
            title={t('analytics.scope')}
          >
            <FilterIcon width={14} height={14} />
            {t('header.filter')}
          </button>
        </div>
      </header>

      <StatsGrid state={state} />
      <div className='chart-grid'>
        <QuotaChartCard state={state} />
        <ModelChartCard state={state} />
      </div>
    </section>
  )
}

export function DashboardView({ state }: { state: DashboardViewModel }) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className='dashboard'>
      <Header state={state} />
      {state.loading ? <div className='loading-bar' /> : null}

      <main className='content'>
        <ErrorBanner state={state} />
        <DataExportNotice state={state} />
        <SubscriptionSection state={state} />
        <PerformanceStrip state={state} />
        <AnalyticsSection
          state={state}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      </main>

      {filtersOpen ? (
        <FilterDialog state={state} onClose={() => setFiltersOpen(false)} />
      ) : null}
    </div>
  )
}
