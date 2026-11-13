import { useMemo } from 'react'
import { createTranslator } from '../../../src/shared/i18n'
import type {
  DashboardViewModel,
  DistributionChartType,
  ModelChartTab,
} from '../../../src/shared/types'
import {
  buildModelChartOption,
  buildQuotaChartOption,
} from '../lib/chartOptions'
import { post } from '../vscodeApi'
import { Chart } from './Chart'
import {
  AreaChartIcon,
  BarChartIcon,
  PieChartIcon,
  WalletIcon,
} from './Icons'

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className='chart-empty'>
      <PieChartIcon width={22} height={22} />
      <span>{label}</span>
    </div>
  )
}

export function QuotaChartCard({ state }: { state: DashboardViewModel }) {
  const t = createTranslator(state.locale)
  const chartType = state.preferences.distributionChart
  const chart = state.charts.quota
  const isEmpty = chart.series.length === 0

  const option = useMemo(
    () =>
      buildQuotaChartOption(
        chart,
        chartType,
        state.currency,
        state.locale,
        state.themeKind,
        state.themeStyle
      ),
    [chart, chartType, state.currency, state.locale, state.themeKind, state.themeStyle]
  )

  const chooseChartType = (nextType: DistributionChartType) => {
    if (nextType === chartType) return
    post({
      type: 'setPreferences',
      preferences: { distributionChart: nextType },
    })
  }

  return (
    <section className='panel glass chart-panel'>
      <header className='panel-header'>
        <div className='panel-title-group'>
          <span className='panel-icon tone-success'>
            <WalletIcon width={15} height={15} />
          </span>
          <h2 className='panel-title'>{t('chart.quotaDistribution')}</h2>
          <span className='panel-total'>
            {t('chart.total')} {chart.totalDisplay}
          </span>
        </div>
        <div className='segmented'>
          <button
            type='button'
            className={chartType === 'bar' ? 'segmented-item active' : 'segmented-item'}
            onClick={() => chooseChartType('bar')}
            title={t('chart.bar')}
          >
            <BarChartIcon width={13} height={13} />
            {t('chart.bar')}
          </button>
          <button
            type='button'
            className={chartType === 'area' ? 'segmented-item active' : 'segmented-item'}
            onClick={() => chooseChartType('area')}
            title={t('chart.area')}
          >
            <AreaChartIcon width={13} height={13} />
            {t('chart.area')}
          </button>
        </div>
      </header>
      <div className='panel-body'>
        {isEmpty ? (
          <ChartEmpty label={t('chart.empty')} />
        ) : (
          <Chart
            key={`${state.themeKind}-${state.themeStyle}`}
            option={option}
            height={340}
          />
        )}
      </div>
    </section>
  )
}

export function ModelChartCard({ state }: { state: DashboardViewModel }) {
  const t = createTranslator(state.locale)
  const tab = state.preferences.modelChart
  const chart = state.charts.count
  const isEmpty =
    tab === 'proportion'
      ? state.charts.proportion.length === 0
      : tab === 'top'
        ? state.charts.ranking.length === 0
        : chart.series.length === 0

  const option = useMemo(
    () =>
      buildModelChartOption(
        {
          chart,
          ranking: state.charts.ranking,
          proportion: state.charts.proportion,
        },
        tab,
        state.locale,
        state.themeKind,
        state.themeStyle
      ),
    [
      chart,
      state.charts.ranking,
      state.charts.proportion,
      tab,
      state.locale,
      state.themeKind,
      state.themeStyle,
    ]
  )

  const chooseTab = (nextTab: ModelChartTab) => {
    if (nextTab === tab) return
    post({ type: 'setPreferences', preferences: { modelChart: nextTab } })
  }

  const height =
    tab === 'top'
      ? Math.max(340, Math.min(state.charts.ranking.length, 20) * 24 + 48)
      : 340

  return (
    <section className='panel glass chart-panel'>
      <header className='panel-header'>
        <div className='panel-title-group'>
          <span className='panel-icon tone-chart4'>
            <PieChartIcon width={15} height={15} />
          </span>
          <h2 className='panel-title'>{t('chart.modelAnalytics')}</h2>
          <span className='panel-total'>
            {t('chart.total')} {chart.totalDisplay}
          </span>
        </div>
        <div className='segmented'>
          {(
            [
              ['trend', t('chart.tabTrend')],
              ['proportion', t('chart.tabProportion')],
              ['top', t('chart.tabTop')],
            ] as Array<[ModelChartTab, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type='button'
              className={tab === value ? 'segmented-item active' : 'segmented-item'}
              onClick={() => chooseTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className='panel-body'>
        {isEmpty ? (
          <ChartEmpty label={t('chart.empty')} />
        ) : (
          <Chart
            key={`${state.themeKind}-${state.themeStyle}-${tab}`}
            option={option}
            height={height}
          />
        )}
      </div>
    </section>
  )
}
