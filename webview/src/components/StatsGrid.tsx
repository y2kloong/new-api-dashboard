import type { ComponentType } from 'react'
import type {
  DashboardViewModel,
  StatCardKey,
  StatTone,
} from '../../../src/shared/types'
import {
  CoinsIcon,
  DownloadIcon,
  GaugeIcon,
  HashIcon,
  LayersIcon,
  UploadIcon,
  ZapIcon,
} from './Icons'

const ICONS: Record<StatCardKey, ComponentType<{ width?: number; height?: number }>> = {
  count: HashIcon,
  quota: CoinsIcon,
  tokens: LayersIcon,
  cacheRead: DownloadIcon,
  cacheCreation: UploadIcon,
  avgRpm: GaugeIcon,
  avgTpm: ZapIcon,
}

const TONE_CLASS: Record<StatTone, string> = {
  info: 'tone-info',
  success: 'tone-success',
  chart2: 'tone-chart2',
  chart3: 'tone-chart3',
  chart4: 'tone-chart4',
  chart5: 'tone-chart5',
  warning: 'tone-warning',
}

export function StatsGrid({ state }: { state: DashboardViewModel }) {
  if (state.stats.length === 0) {
    return (
      <div className='stats-grid'>
        {Array.from({ length: 7 }, (_value, index) => (
          <div className='stat-card glass skeleton' key={index}>
            <div className='skeleton-line short' />
            <div className='skeleton-line tall' />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='stats-grid'>
      {state.stats.map((card) => {
        const Icon = ICONS[card.key]
        return (
          <div className='stat-card glass' key={card.key} title={card.fullValue}>
            <div className='stat-head'>
              <span className={`stat-icon ${TONE_CLASS[card.tone]}`}>
                <Icon width={14} height={14} />
              </span>
              <span className='stat-label'>{card.label}</span>
            </div>
            <div className='stat-value'>{card.value}</div>
            <div className='stat-desc'>{card.description}</div>
          </div>
        )
      })}
    </div>
  )
}
