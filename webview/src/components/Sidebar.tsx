import { useState } from 'react'
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
import { StyleSelect } from './ThemeStyleSwitch'

interface SidebarSettingsProps {
  state: DashboardViewModel
  onClose: () => void
}

function SidebarSettings({ state, onClose }: SidebarSettingsProps) {
  const t = createTranslator(state.locale)
  const profile = state.profile
  if (!profile) return null

  const themeMode = state.preferences.themeMode
  const themeModeLabel = t(`theme.${themeMode}`)
  const ThemeIcon =
    themeMode === 'dark' ? MoonIcon : themeMode === 'light' ? SunIcon : MonitorIcon
  const otherProfiles = state.profiles.filter((item) => item.id !== profile.id)

  return (
    <div className='sidebar'>
      <div className='side-top side-head'>
        <div className='side-name'>{t('setup.manageTitle')}</div>
        <button type='button' className='outline-button' onClick={onClose}>
          {t('common.done')}
        </button>
      </div>

      <section className='side-section glass'>
        <div className='side-label'>{t('sidebar.currentConfig')}</div>
        <div className='side-plan'>{profile.name}</div>
        <div className='side-config-line'>
          <span className='side-meta'>
            {profile.displayName || profile.username || '—'}
          </span>
          {profile.isAdmin ? (
            <span className='chip admin'>{t('header.admin')}</span>
          ) : null}
        </div>
        <div className='side-meta mono side-url' title={profile.baseUrl}>
          {profile.baseUrl}
        </div>
      </section>

      {otherProfiles.length > 0 ? (
        <section className='side-section glass'>
          <div className='side-label'>{t('sidebar.switchConfig')}</div>
          <div className='side-profile-list'>
            {otherProfiles.map((item) => (
              <div className='side-profile-item' key={item.id}>
                <div className='side-profile-info'>
                  <div className='side-profile-name'>{item.name}</div>
                  <div className='side-meta'>
                    {item.displayName || item.username || item.baseUrl}
                  </div>
                </div>
                <button
                  type='button'
                  className='ghost-button'
                  onClick={() =>
                    post({ type: 'switchProfile', profileId: item.id })
                  }
                >
                  {t('setup.useProfile')}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className='side-section glass'>
        <div className='side-label'>{t('theme.label')}</div>
        <div className='side-theme-row'>
          <span className='side-meta'>
            {t('theme.current', { mode: themeModeLabel })}
          </span>
          <div className='side-theme-actions'>
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
          </div>
        </div>
        <div className='side-theme-row'>
          <span className='side-meta'>{t('style.label')}</span>
          <StyleSelect
            locale={state.locale}
            style={state.themeStyle}
            className='style-select-compact'
          />
        </div>
      </section>

      {state.error ? (
        <div className='side-error'>{state.error.message}</div>
      ) : null}

      <button
        type='button'
        className='primary-button full'
        onClick={() => post({ type: 'openSetup' })}
      >
        {t('sidebar.editInPanel')}
      </button>
      <button
        type='button'
        className='outline-button full'
        onClick={() => {
          onClose()
          post({ type: 'openDashboard' })
        }}
      >
        {t('sidebar.openDashboard')}
      </button>
    </div>
  )
}

export function SidebarView({ state }: { state: DashboardViewModel }) {
  const t = createTranslator(state.locale)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const themeMode = state.preferences.themeMode
  const themeModeLabel = t(`theme.${themeMode}`)
  const ThemeIcon =
    themeMode === 'dark' ? MoonIcon : themeMode === 'light' ? SunIcon : MonitorIcon

  if (!state.profile || state.profiles.length === 0) {
    return (
      <div className='sidebar sidebar-empty'>
        <h2 className='side-heading'>{t('sidebar.connectTitle')}</h2>
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

  if (settingsOpen) {
    return (
      <SidebarSettings state={state} onClose={() => setSettingsOpen(false)} />
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
          onClick={() => setSettingsOpen(true)}
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
        <div className='side-metrics'>
          <div className='side-metric-row primary'>
            <span className='side-metric-label'>{t('sidebar.quotaUsed')}</span>
            <span className='side-metric-value' title={state.usage24hQuotaText}>
              {state.usage24hQuotaText}
            </span>
          </div>
          <div className='side-metric-row'>
            <span className='side-metric-label'>{t('sidebar.requests')}</span>
            <span className='side-metric-value' title={state.usage24hCountText}>
              {state.usage24hCountText}
            </span>
          </div>
        </div>
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
