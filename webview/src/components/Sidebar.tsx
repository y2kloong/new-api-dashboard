import { createTranslator } from '../../../src/shared/i18n'
import type { DashboardViewModel } from '../../../src/shared/types'
import { nextThemeMode } from '../lib/theme'
import { post } from '../vscodeApi'
import {
  MonitorIcon,
  MoonIcon,
  RefreshIcon,
  SettingsIcon,
  SunIcon,
} from './Icons'

export function SidebarView({ state }: { state: DashboardViewModel }) {
  const t = createTranslator(state.locale)
  const themeMode = state.preferences.themeMode
  const themeModeLabel = t(`theme.${themeMode}`)
  const ThemeIcon =
    themeMode === 'dark' ? MoonIcon : themeMode === 'light' ? SunIcon : MonitorIcon

  if (state.setupMode || !state.profile) {
    return (
      <div className='sidebar sidebar-empty'>
        <h2 className='side-heading'>{t('sidebar.title')}</h2>
        <p className='muted'>{t('sidebar.noProfile')}</p>
        <button
          type='button'
          className='primary-button full'
          onClick={() => post({ type: 'openSetup' })}
        >
          {t('sidebar.connect')}
        </button>
      </div>
    )
  }

  const card = state.subscription?.cards[0]

  return (
    <div className='sidebar'>
      <div className='side-top'>
        <div className='side-profile'>
          <div className='side-name'>{state.profile.name}</div>
          <div className='side-meta'>
            {state.profile.displayName || state.profile.username || '—'}
          </div>
        </div>
        <button
          type='button'
          className='icon-button'
          onClick={() =>
            post({
              type: 'setPreferences',
              preferences: { themeMode: nextThemeMode(themeMode) },
            })
          }
          aria-label={t('theme.current', { mode: themeModeLabel })}
          title={t('theme.current', { mode: themeModeLabel })}
        >
          <ThemeIcon width={14} height={14} />
        </button>
        <button
          type='button'
          className='icon-button'
          onClick={() => post({ type: 'openSetup' })}
          aria-label={t('header.manage')}
          title={t('header.manage')}
        >
          <SettingsIcon width={14} height={14} />
        </button>
        <button
          type='button'
          className='icon-button'
          onClick={() => post({ type: 'refresh' })}
          aria-label={t('common.refresh')}
          title={t('common.refresh')}
        >
          <RefreshIcon className={state.loading ? 'spin' : undefined} />
        </button>
      </div>

      <section className='side-section glass'>
        <div className='side-label'>{t('subscription.title')}</div>
        {card ? (
          <>
            <div className='side-plan'>
              {card.planTitle || t('subscription.id', { id: card.id })}
            </div>
            <div className='side-meta'>
              {t('subscription.remainingDays', { n: card.remainingDays })}
            </div>
            <div className='progress'>
              <span style={{ width: `${card.usedPercent}%` }} />
            </div>
            <div className='side-quota mono'>
              {card.unlimited
                ? t('common.unlimited')
                : `${card.quotaRemainingText} / ${card.quotaTotalText}`}
            </div>
          </>
        ) : (
          <div className='muted'>{t('subscription.noActive')}</div>
        )}
      </section>

      <section className='side-section glass'>
        <div className='side-label'>{t('sidebar.usage24h')}</div>
        <div className='side-big'>{state.usage24hQuotaText}</div>
        <div className='side-meta'>{state.usage24hCountText}</div>
      </section>

      {state.error ? (
        <div className='side-error'>{state.error.message}</div>
      ) : null}
      {state.stale ? (
        <div className='side-meta'>{t('common.stale')}</div>
      ) : null}

      <button
        type='button'
        className='primary-button full'
        onClick={() => post({ type: 'openDashboard' })}
      >
        {t('sidebar.openDashboard')}
      </button>
    </div>
  )
}
