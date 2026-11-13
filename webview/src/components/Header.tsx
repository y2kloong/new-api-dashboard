import { createTranslator } from '../../../src/shared/i18n'
import { formatClock } from '../../../src/shared/time'
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

interface HeaderProps {
  state: DashboardViewModel
}

export function Header({ state }: HeaderProps) {
  const t = createTranslator(state.locale)
  const profile = state.profile
  const themeMode = state.preferences.themeMode
  const themeModeLabel = t(`theme.${themeMode}`)
  const ThemeIcon =
    themeMode === 'dark' ? MoonIcon : themeMode === 'light' ? SunIcon : MonitorIcon

  return (
    <header className='topbar glass'>
      <div className='brand'>
        <div className='brand-mark' aria-hidden='true'>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
            <rect
              x='3'
              y='3'
              width='18'
              height='18'
              rx='5'
              stroke='currentColor'
              strokeWidth='1.3'
              opacity='0.6'
            />
            <rect x='6.4' y='12.2' width='2.6' height='5.4' rx='0.8' fill='currentColor' />
            <rect x='10.7' y='9' width='2.6' height='8.6' rx='0.8' fill='currentColor' />
            <rect x='15' y='6' width='2.6' height='11.6' rx='0.8' fill='currentColor' />
          </svg>
        </div>
        <div className='brand-text'>
          <div className='brand-title'>{t('app.title')}</div>
          <div className='brand-sub'>
            {profile?.displayName || profile?.username || profile?.baseUrl}
          </div>
        </div>
      </div>

      <div className='topbar-actions'>
        {state.profiles.length > 1 ? (
          <select
            className='glass-select'
            value={profile?.id ?? ''}
            onChange={(event) =>
              post({ type: 'switchProfile', profileId: event.target.value })
            }
            title={t('header.profile')}
          >
            {state.profiles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}

        {profile?.isAdmin ? (
          <span className='chip admin'>{t('header.admin')}</span>
        ) : null}

        {state.updatedAt ? (
          <span className='updated'>
            {t('common.updatedAt', {
              time: formatClock(state.updatedAt, state.locale),
            })}
          </span>
        ) : null}

        {state.stale ? (
          <span className='badge warning'>{t('common.stale')}</span>
        ) : null}

        <button
          type='button'
          className='icon-button'
          onClick={() => post({ type: 'refresh' })}
          title={t('common.refresh')}
          aria-label={t('common.refresh')}
        >
          <RefreshIcon className={state.loading ? 'spin' : undefined} />
        </button>

        <button
          type='button'
          className='icon-button'
          onClick={() =>
            post({
              type: 'setPreferences',
              preferences: { themeMode: nextThemeMode(themeMode) },
            })
          }
          title={t('theme.current', { mode: themeModeLabel })}
          aria-label={t('theme.current', { mode: themeModeLabel })}
        >
          <ThemeIcon />
        </button>

        <StyleSelect locale={state.locale} style={state.themeStyle} />

        <button
          type='button'
          className='icon-button'
          onClick={() => post({ type: 'openSetup' })}
          title={t('header.manage')}
          aria-label={t('header.manage')}
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  )
}
