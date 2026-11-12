import {
  formatCompactNumber,
  formatInteger,
} from '../../../src/shared/format'
import { translate } from '../../../src/shared/i18n'
import type {
  ChartViewModel,
  CurrencySummary,
  DistributionChartType,
  Locale,
  ModelChartTab,
  ProportionItemViewModel,
  RankingItemViewModel,
  ThemeKind,
} from '../../../src/shared/types'
import type { EChartsCoreOption } from './echarts'

const SERIES_PALETTE = [
  '#38BDF8',
  '#A78BFA',
  '#22C55E',
  '#F59E0B',
  '#FB7185',
  '#2DD4BF',
  '#818CF8',
  '#94A3B8',
]

interface ChartTheme {
  text: string
  strongText: string
  grid: string
  tooltipBackground: string
  tooltipBorder: string
}

function getChartTheme(theme: ThemeKind): ChartTheme {
  if (theme === 'light') {
    return {
      text: '#475569',
      strongText: '#0F172A',
      grid: 'rgba(15,23,42,0.08)',
      tooltipBackground: 'rgba(255,255,255,0.96)',
      tooltipBorder: 'rgba(15,23,42,0.10)',
    }
  }
  return {
    text: '#94A3B8',
    strongText: '#F8FAFC',
    grid: 'rgba(255,255,255,0.08)',
    tooltipBackground: 'rgba(15,23,42,0.94)',
    tooltipBorder: 'rgba(255,255,255,0.16)',
  }
}

function withAlpha(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace('#', '')
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function intlLocale(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}

function formatAxisValue(
  value: number,
  currency: CurrencySummary,
  locale: Locale
): string {
  if (currency.kind === 'tokens') return formatCompactNumber(value, locale)
  return `${currency.symbol}${formatCompactNumber(value, locale)}`
}

function formatTooltipValue(
  value: number,
  currency: CurrencySummary,
  locale: Locale
): string {
  if (currency.kind === 'tokens') return formatInteger(value, locale)
  const digits = Math.abs(value) >= 1 ? 2 : 4
  return `${currency.symbol}${new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}`
}

interface AxisTooltipParam {
  axisValueLabel?: string
  seriesName?: string
  value?: number | string
  color?: string
}

function buildTooltipHtml(
  title: string,
  rows: Array<{ name: string; value: string; color: string }>,
  totalLabel: string,
  totalValue: string,
  theme: ChartTheme
): string {
  const rowHtml = rows
    .map(
      (row) =>
        `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;min-width:0">
          <span style="width:8px;height:8px;border-radius:3px;background:${row.color};flex:none"></span>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${theme.text}">${escapeHtml(row.name)}</span>
          <span style="color:${theme.strongText};font-weight:600;font-variant-numeric:tabular-nums">${row.value}</span>
        </div>`
    )
    .join('')

  return `<div style="min-width:190px;padding:10px 12px;border-radius:10px;background:${theme.tooltipBackground};border:1px solid ${theme.tooltipBorder};backdrop-filter:blur(16px);box-shadow:0 12px 30px rgba(2,6,23,.35);font:12px var(--vscode-font-family);color:${theme.text}">
    <div style="font-weight:600;color:${theme.strongText};margin-bottom:4px">${escapeHtml(title)}</div>
    ${rowHtml}
    <div style="display:flex;justify-content:space-between;gap:12px;margin-top:8px;padding-top:6px;border-top:1px solid ${theme.tooltipBorder};color:${theme.strongText};font-weight:600">
      <span>${escapeHtml(totalLabel)}</span><span style="font-variant-numeric:tabular-nums">${totalValue}</span>
    </div>
  </div>`
}

function legendConfiguration(theme: ChartTheme) {
  return {
    type: 'scroll',
    bottom: 0,
    left: 8,
    right: 8,
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 12,
    textStyle: { color: theme.text, fontSize: 11 },
    pageIconColor: theme.text,
    pageIconInactiveColor: theme.grid,
    pageTextStyle: { color: theme.text, fontSize: 10 },
  }
}

function gridConfiguration(hasLegend: boolean) {
  return {
    left: 8,
    right: 16,
    top: 16,
    bottom: hasLegend ? 56 : 16,
    containLabel: true,
  }
}

function axisConfiguration(theme: ChartTheme) {
  return {
    axisLine: { lineStyle: { color: theme.grid } },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: theme.grid } },
    axisLabel: { color: theme.text, fontSize: 10, hideOverlap: true },
  }
}

export function buildQuotaChartOption(
  chart: ChartViewModel,
  chartType: DistributionChartType,
  currency: CurrencySummary,
  locale: Locale,
  themeKind: ThemeKind
): EChartsCoreOption {
  const theme = getChartTheme(themeKind)
  const labels = chart.buckets.map((bucket) => bucket.label)
  const hasLegend = chart.series.length > 0
  const palette = SERIES_PALETTE.map((color) => withAlpha(color, 0.78))

  const series = chart.series.map((seriesItem, index) => ({
    name: seriesItem.name,
    type: chartType === 'bar' ? 'bar' : 'line',
    stack: 'quota',
    data: seriesItem.values,
    barMaxWidth: 26,
    showSymbol: false,
    smooth: false,
    lineStyle: { width: 1.4 },
    areaStyle: chartType === 'area' ? { opacity: 0.26 } : undefined,
    itemStyle: {
      color: palette[index % palette.length],
      borderRadius: chartType === 'bar' ? [3, 3, 0, 0] : 0,
    },
    emphasis: { focus: 'series' },
  }))

  return {
    color: palette,
    animationDuration: 320,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: chartType === 'bar' ? 'shadow' : 'line' },
      backgroundColor: 'transparent',
      borderWidth: 0,
      padding: 0,
      formatter: (rawParams: unknown) => {
        const params = Array.isArray(rawParams)
          ? (rawParams as AxisTooltipParam[])
          : [rawParams as AxisTooltipParam]
        const title = params[0]?.axisValueLabel ?? ''
        const rows = params
          .map((param) => ({
            name: String(param.seriesName ?? ''),
            value: Number(param.value) || 0,
            color: String(param.color ?? '#38BDF8'),
          }))
          .sort((left, right) => right.value - left.value)
        const total = rows.reduce((sum, row) => sum + row.value, 0)
        return buildTooltipHtml(
          title,
          rows.map((row) => ({
            name: row.name,
            color: row.color,
            value: formatTooltipValue(row.value, currency, locale),
          })),
          translate(locale, 'chart.tooltipTotal'),
          formatTooltipValue(total, currency, locale),
          theme
        )
      },
    },
    legend: hasLegend ? legendConfiguration(theme) : { show: false },
    grid: gridConfiguration(hasLegend),
    xAxis: {
      type: 'category',
      data: labels,
      ...axisConfiguration(theme),
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      ...axisConfiguration(theme),
      axisLabel: {
        color: theme.text,
        fontSize: 10,
        formatter: (value: number) => formatAxisValue(value, currency, locale),
      },
    },
    series,
  }
}

export interface ModelChartInput {
  chart: ChartViewModel
  ranking: RankingItemViewModel[]
  proportion: ProportionItemViewModel[]
}

export function buildModelChartOption(
  input: ModelChartInput,
  tab: ModelChartTab,
  locale: Locale,
  themeKind: ThemeKind
): EChartsCoreOption {
  const { chart } = input
  const theme = getChartTheme(themeKind)
  const palette = SERIES_PALETTE.map((color) => withAlpha(color, 0.78))

  if (tab === 'proportion') {
    const hasLegend = input.proportion.length > 0
    return {
      color: palette,
      animationDuration: 320,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        formatter: (rawParam: unknown) => {
          const param = rawParam as {
            name?: string
            value?: number
            percent?: number
            color?: string
          }
          const value = Number(param.value) || 0
          const percent = Number(param.percent) || 0
          return buildTooltipHtml(
            String(param.name ?? ''),
            [
              {
                name: translate(locale, 'chart.axisCount'),
                value: `${formatInteger(value, locale)} · ${percent.toFixed(1)}%`,
                color: String(param.color ?? '#38BDF8'),
              },
            ],
            translate(locale, 'chart.tooltipTotal'),
            formatInteger(chart.total, locale),
            theme
          )
        },
      },
      legend: hasLegend
        ? { ...legendConfiguration(theme), bottom: 0 }
        : { show: false },
      series: [
        {
          type: 'pie',
          radius: ['44%', '68%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor:
              themeKind === 'light'
                ? 'rgba(255,255,255,0.85)'
                : 'rgba(15,23,42,0.85)',
            borderWidth: 2,
            borderRadius: 6,
          },
          label: {
            color: theme.text,
            fontSize: 11,
            formatter: '{b}\n{d}%',
          },
          labelLine: { lineStyle: { color: theme.grid } },
          data: input.proportion.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: palette[index % palette.length] },
          })),
        },
      ],
    }
  }

  if (tab === 'top') {
    const ranking = input.ranking

    return {
      animationDuration: 320,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        formatter: (rawParam: unknown) => {
          const param = rawParam as {
            name?: string
            value?: number
            color?: string
          }
          return buildTooltipHtml(
            String(param.name ?? ''),
            [
              {
                name: translate(locale, 'chart.axisCount'),
                value: formatInteger(Number(param.value) || 0, locale),
                color: String(param.color ?? '#38BDF8'),
              },
            ],
            translate(locale, 'chart.tooltipTotal'),
            formatInteger(chart.total, locale),
            theme
          )
        },
      },
      grid: { left: 8, right: 52, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        ...axisConfiguration(theme),
        axisLabel: {
          color: theme.text,
          fontSize: 10,
          formatter: (value: number) => formatCompactNumber(value, locale),
        },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: ranking.map((item) => item.name),
        ...axisConfiguration(theme),
        splitLine: { show: false },
        axisLabel: {
          color: theme.text,
          fontSize: 11,
          width: 140,
          overflow: 'truncate',
        },
      },
      series: [
        {
          type: 'bar',
          data: ranking.map((item, index) => ({
            value: item.value,
            itemStyle: {
              color: palette[index % palette.length],
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barMaxWidth: 16,
          label: {
            show: true,
            position: 'right',
            color: theme.text,
            fontSize: 10,
            formatter: (params: unknown) => {
              const index = Number(
                (params as { dataIndex?: number }).dataIndex ?? -1
              )
              return ranking[index]?.display ?? ''
            },
          },
        },
      ],
    }
  }

  const labels = chart.buckets.map((bucket) => bucket.label)
  const hasLegend = chart.series.length > 0
  return {
    color: palette,
    animationDuration: 320,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      backgroundColor: 'transparent',
      borderWidth: 0,
      padding: 0,
      formatter: (rawParams: unknown) => {
        const params = Array.isArray(rawParams)
          ? (rawParams as AxisTooltipParam[])
          : [rawParams as AxisTooltipParam]
        const title = params[0]?.axisValueLabel ?? ''
        const rows = params
          .map((param) => ({
            name: String(param.seriesName ?? ''),
            value: Number(param.value) || 0,
            color: String(param.color ?? '#38BDF8'),
          }))
          .sort((left, right) => right.value - left.value)
        return buildTooltipHtml(
          title,
          rows.map((row) => ({
            name: row.name,
            color: row.color,
            value: formatInteger(row.value, locale),
          })),
          translate(locale, 'chart.tooltipTotal'),
          formatInteger(chart.total, locale),
          theme
        )
      },
    },
    legend: hasLegend ? legendConfiguration(theme) : { show: false },
    grid: gridConfiguration(hasLegend),
    xAxis: {
      type: 'category',
      data: labels,
      ...axisConfiguration(theme),
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      ...axisConfiguration(theme),
      axisLabel: {
        color: theme.text,
        fontSize: 10,
        formatter: (value: number) => formatCompactNumber(value, locale),
      },
    },
    series: chart.series.map((seriesItem, index) => ({
      name: seriesItem.name,
      type: 'line',
      stack: 'count',
      data: seriesItem.values,
      showSymbol: false,
      smooth: false,
      lineStyle: { width: 1.4 },
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: palette[index % palette.length] },
      emphasis: { focus: 'series' },
    })),
  }
}
