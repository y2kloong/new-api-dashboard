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
  ThemeStyle,
} from '../../../src/shared/types'
import type { EChartsCoreOption } from './echarts'

/** Frosted-skin series colours. */
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

/**
 * Pixel-skin series colours: the same hue order as SERIES_PALETTE, re-saturated
 * for the 8-bit look and kept in sync with the tokens in pixel.css.
 */
const PIXEL_SERIES_PALETTE = [
  '#5CC8FF',
  '#C77DFF',
  '#7DFF4D',
  '#FFCF3D',
  '#FF7D9C',
  '#4DE8C2',
  '#8C9BFF',
  '#B9B3D4',
]

/**
 * shadcn/ui series colours: the Tailwind 400 steps used by shadcn's dark charts,
 * in the same hue order as SERIES_PALETTE.
 */
const SHADCN_SERIES_PALETTE = [
  '#FB923C',
  '#2DD4BF',
  '#60A5FA',
  '#FACC15',
  '#F472B6',
  '#22D3EE',
  '#A78BFA',
  '#A1A1AA',
]

/** Tailwind 600 steps for the light shadcn palette. */
const SHADCN_SERIES_PALETTE_LIGHT = [
  '#EA580C',
  '#0D9488',
  '#2563EB',
  '#CA8A04',
  '#DB2777',
  '#0891B2',
  '#7C3AED',
  '#52525B',
]

interface ChartTheme {
  /** Skin that produced the theme; drives the tooltip chrome. */
  skin: ThemeStyle
  text: string
  strongText: string
  grid: string
  tooltipBackground: string
  tooltipBorder: string
  /** Soft shadow colour for glass/shadcn, hard edge colour for pixel. */
  shadow: string
  palette: string[]
  seriesAlpha: number
  barRadius: number
  fontSize: number
  labelFontSize: number
  surfaceBorder: string
}

function getChartTheme(themeKind: ThemeKind, themeStyle: ThemeStyle): ChartTheme {
  if (themeStyle === 'pixel') {
    if (themeKind === 'high-contrast') {
      return {
        text: 'var(--vscode-descriptionForeground, #CCCCCC)',
        strongText: 'var(--vscode-editor-foreground, #FFFFFF)',
        grid: 'var(--vscode-contrastBorder, #FFFFFF)',
        tooltipBackground: 'var(--vscode-editor-background, #000000)',
        tooltipBorder: 'var(--vscode-contrastBorder, #FFFFFF)',
        shadow: 'transparent',
        palette: PIXEL_SERIES_PALETTE,
        seriesAlpha: 1,
        barRadius: 0,
        fontSize: 10,
        labelFontSize: 9,
        surfaceBorder: 'var(--vscode-editor-background, #000000)',
        skin: 'pixel',
      }
    }
    return themeKind === 'light'
      ? {
          text: '#4b4a5f',
          strongText: '#1d1d2b',
          grid: 'rgba(42,42,61,0.22)',
          tooltipBackground: '#fffaf0',
          tooltipBorder: '#2a2a3d',
          shadow: '#b7b1a0',
          palette: [
            '#1263A8',
            '#6B3FA0',
            '#167D3A',
            '#9A6A00',
            '#B02A54',
            '#0E7A6B',
            '#4352C2',
            '#4B4A5F',
          ],
          seriesAlpha: 0.9,
          barRadius: 0,
          fontSize: 10,
          labelFontSize: 9,
          surfaceBorder: '#f2eee0',
          skin: 'pixel',
        }
      : {
          text: '#b9b3d4',
          strongText: '#f7f7e8',
          grid: 'rgba(185,179,212,0.25)',
          tooltipBackground: '#2f2f4a',
          tooltipBorder: '#2b2b3c',
          shadow: '#14141f',
          palette: PIXEL_SERIES_PALETTE,
          seriesAlpha: 0.92,
          barRadius: 0,
          fontSize: 10,
          labelFontSize: 9,
          surfaceBorder: '#232338',
          skin: 'pixel',
        }
  }

  if (themeStyle === 'shadcn') {
    if (themeKind === 'high-contrast') {
      return {
        skin: 'shadcn',
        text: 'var(--vscode-descriptionForeground, #CCCCCC)',
        strongText: 'var(--vscode-editor-foreground, #FFFFFF)',
        grid: 'var(--vscode-contrastBorder, #FFFFFF)',
        tooltipBackground: 'var(--vscode-editor-background, #000000)',
        tooltipBorder: 'var(--vscode-contrastBorder, #FFFFFF)',
        shadow: 'transparent',
        palette: SHADCN_SERIES_PALETTE,
        seriesAlpha: 1,
        barRadius: 2,
        fontSize: 10,
        labelFontSize: 10,
        surfaceBorder: 'var(--vscode-editor-background, #000000)',
      }
    }
    return themeKind === 'light'
      ? {
          skin: 'shadcn',
          text: '#52525b',
          strongText: '#09090b',
          grid: '#e4e4e7',
          tooltipBackground: '#ffffff',
          tooltipBorder: '#e4e4e7',
          shadow: 'rgba(9,9,11,0.16)',
          palette: SHADCN_SERIES_PALETTE_LIGHT,
          seriesAlpha: 1,
          barRadius: 2,
          fontSize: 10,
          labelFontSize: 10,
          surfaceBorder: '#ffffff',
        }
      : {
          skin: 'shadcn',
          text: '#a1a1aa',
          strongText: '#fafafa',
          grid: '#27272a',
          tooltipBackground: '#18181b',
          tooltipBorder: '#27272a',
          shadow: 'rgba(0,0,0,0.5)',
          palette: SHADCN_SERIES_PALETTE,
          seriesAlpha: 1,
          barRadius: 2,
          fontSize: 10,
          labelFontSize: 10,
          surfaceBorder: '#0d0d10',
        }
  }

  if (themeKind === 'light') {
    return {
      text: '#475569',
      strongText: '#0F172A',
      grid: 'rgba(15,23,42,0.08)',
      tooltipBackground: 'rgba(255,255,255,0.96)',
      tooltipBorder: 'rgba(15,23,42,0.10)',
      shadow: 'rgba(2,6,23,0.35)',
      palette: SERIES_PALETTE,
      seriesAlpha: 0.78,
      barRadius: 3,
      fontSize: 10,
      labelFontSize: 11,
      surfaceBorder: 'rgba(255,255,255,0.85)',
      skin: 'glass',
    }
  }
  return {
    text: '#94A3B8',
    strongText: '#F8FAFC',
    grid: 'rgba(255,255,255,0.08)',
    tooltipBackground: 'rgba(15,23,42,0.94)',
    tooltipBorder: 'rgba(255,255,255,0.16)',
    shadow: 'rgba(2,6,23,0.35)',
    palette: SERIES_PALETTE,
    seriesAlpha: 0.78,
    barRadius: 3,
    fontSize: 10,
    labelFontSize: 11,
    surfaceBorder: 'rgba(15,23,42,0.85)',
    skin: 'glass',
  }
}

function withAlpha(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace('#', '')
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function buildPalette(theme: ChartTheme): string[] {
  return theme.palette.map((color) => withAlpha(color, theme.seriesAlpha))
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

interface TooltipChrome {
  container: string
  swatch: string
  title: string
  divider: string
  valueWeight: number
}

/** Tooltip surface per skin: glass blurs, pixel hardens, shadcn stays flat. */
function tooltipChrome(theme: ChartTheme): TooltipChrome {
  const base = `min-width:190px;padding:10px 12px;background:${theme.tooltipBackground};color:${theme.text};font:12px var(--vscode-font-family)`

  if (theme.skin === 'pixel') {
    return {
      container: `min-width:190px;padding:10px 12px;border-radius:0;border:2px solid ${theme.tooltipBorder};box-shadow:4px 4px 0 0 ${theme.shadow};background:${theme.tooltipBackground};color:${theme.text};font:11px/1.7 var(--vscode-font-family)`,
      swatch: 'border-radius:0',
      title: `color:${theme.strongText};margin-bottom:6px;letter-spacing:0.02em`,
      divider: `2px dashed ${theme.tooltipBorder}`,
      valueWeight: 400,
    }
  }

  if (theme.skin === 'shadcn') {
    return {
      container: `${base};border-radius:8px;border:1px solid ${theme.tooltipBorder};box-shadow:0 8px 24px -8px ${theme.shadow}`,
      swatch: 'border-radius:2px',
      title: `font-weight:600;color:${theme.strongText};margin-bottom:6px`,
      divider: `1px solid ${theme.tooltipBorder}`,
      valueWeight: 600,
    }
  }

  return {
    container: `${base};border-radius:10px;border:1px solid ${theme.tooltipBorder};backdrop-filter:blur(16px);box-shadow:0 12px 30px ${theme.shadow}`,
    swatch: 'border-radius:3px',
    title: `font-weight:600;color:${theme.strongText};margin-bottom:4px`,
    divider: `1px solid ${theme.tooltipBorder}`,
    valueWeight: 600,
  }
}

function buildTooltipHtml(
  title: string,
  rows: Array<{ name: string; value: string; color: string }>,
  totalLabel: string,
  totalValue: string,
  theme: ChartTheme
): string {
  const chrome = tooltipChrome(theme)

  const rowHtml = rows
    .map(
      (row) =>
        `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;min-width:0">
          <span style="width:8px;height:8px;${chrome.swatch};background:${row.color};flex:none"></span>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${theme.text}">${escapeHtml(row.name)}</span>
          <span style="color:${theme.strongText};font-weight:${chrome.valueWeight};font-variant-numeric:tabular-nums">${row.value}</span>
        </div>`
    )
    .join('')

  return `<div style="${chrome.container}">
    <div style="${chrome.title}">${escapeHtml(title)}</div>
    ${rowHtml}
    <div style="display:flex;justify-content:space-between;gap:12px;margin-top:8px;padding-top:6px;border-top:${chrome.divider};color:${theme.strongText};font-weight:${chrome.valueWeight}">
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
    textStyle: {
      color: theme.text,
      fontSize: 11,
    },
    pageIconColor: theme.text,
    pageIconInactiveColor: theme.grid,
    pageTextStyle: {
      color: theme.text,
      fontSize: 10,
    },
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
  const lineType = theme.skin === 'pixel' ? ('dashed' as const) : ('solid' as const)
  const lineWidth = theme.skin === 'pixel' ? 2 : 1
  return {
    axisLine: { lineStyle: { color: theme.grid, type: lineType, width: lineWidth } },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: theme.grid, type: lineType, width: 1 } },
    axisLabel: {
      color: theme.text,
      fontSize: theme.fontSize,
      hideOverlap: true,
    },
  }
}

function chartAnimation(theme: ChartTheme, duration = 320) {
  return theme.skin === 'pixel' ? false : { animationDuration: duration }
}

export function buildQuotaChartOption(
  chart: ChartViewModel,
  chartType: DistributionChartType,
  currency: CurrencySummary,
  locale: Locale,
  themeKind: ThemeKind,
  themeStyle: ThemeStyle = 'glass'
): EChartsCoreOption {
  const theme = getChartTheme(themeKind, themeStyle)
  const labels = chart.buckets.map((bucket) => bucket.label)
  const hasLegend = chart.series.length > 0
  const palette = buildPalette(theme)

  const series = chart.series.map((seriesItem, index) => ({
    name: seriesItem.name,
    type: chartType === 'bar' ? 'bar' : 'line',
    stack: 'quota',
    data: seriesItem.values,
    barMaxWidth: 26,
    showSymbol: false,
    smooth: false,
    step: theme.skin === 'pixel' ? ('end' as const) : false,
    lineStyle: { width: theme.skin === 'pixel' ? 3 : 1.4 },
    areaStyle: chartType === 'area' ? { opacity: theme.skin === 'pixel' ? 0.32 : 0.26 } : undefined,
    itemStyle: {
      color: palette[index % palette.length],
      borderRadius:
        chartType === 'bar' ? [theme.barRadius, theme.barRadius, 0, 0] : 0,
    },
    emphasis: { focus: 'series' },
  }))

  return {
    color: palette,
    ...chartAnimation(theme),
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: chartType === 'bar' ? 'shadow' : 'line',
        shadowStyle: theme.skin === 'pixel'
          ? { color: 'rgba(185,179,212,0.12)' }
          : undefined,
        lineStyle: theme.skin === 'pixel' ? { width: 2, type: 'dashed' } : undefined,
      },
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
        fontSize: theme.fontSize,
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
  themeKind: ThemeKind,
  themeStyle: ThemeStyle = 'glass'
): EChartsCoreOption {
  const { chart } = input
  const theme = getChartTheme(themeKind, themeStyle)
  const palette = buildPalette(theme)

  if (tab === 'proportion') {
    const hasLegend = input.proportion.length > 0
    return {
      color: palette,
      ...chartAnimation(theme),
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
            borderColor: theme.surfaceBorder,
            borderWidth: theme.skin === 'pixel' ? 3 : 2,
            borderRadius: theme.skin === 'glass' ? 6 : 0,
          },
          label: {
            color: theme.text,
            fontSize: theme.labelFontSize,
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
      ...chartAnimation(theme),
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
          fontSize: theme.fontSize,
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
          fontSize: theme.labelFontSize,
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
              borderRadius:
                theme.barRadius === 0 ? 0 : [0, theme.barRadius, theme.barRadius, 0],
            },
          })),
          barMaxWidth: 16,
          label: {
            show: true,
            position: 'right',
            color: theme.text,
            fontSize: theme.fontSize,
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
    ...chartAnimation(theme),
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: theme.skin === 'pixel' ? { width: 2, type: 'dashed' } : undefined,
      },
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
        fontSize: theme.fontSize,
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
      step: theme.skin === 'pixel' ? ('end' as const) : false,
      lineStyle: { width: theme.skin === 'pixel' ? 3 : 1.4 },
      areaStyle: { opacity: theme.skin === 'pixel' ? 0.38 : 0.3 },
      itemStyle: { color: palette[index % palette.length] },
      emphasis: { focus: 'series' },
    })),
  }
}
