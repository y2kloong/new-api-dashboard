import { useEffect, useState, type FormEvent } from 'react'
import { createTranslator } from '../../../src/shared/i18n'
import type {
  DashboardViewModel,
  ProfileSummary,
  ThemeMode,
} from '../../../src/shared/types'
import { post } from '../vscodeApi'
import {
  AlertIcon,
  CheckIcon,
  MonitorIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  ServerIcon,
  SunIcon,
  TrashIcon,
} from './Icons'
import { StyleOptionGroup } from './ThemeStyleSwitch'

interface SetupViewProps {
  state: DashboardViewModel
  testResult: { ok: boolean; message: string } | null
}

const THEME_MODES: ThemeMode[] = ['auto', 'dark', 'light']

const THEME_LABEL_KEYS = {
  auto: 'theme.auto',
  dark: 'theme.dark',
  light: 'theme.light',
} as const

const THEME_ICONS = {
  auto: MonitorIcon,
  dark: MoonIcon,
  light: SunIcon,
} as const

export function SetupView({ state, testResult }: SetupViewProps) {
  const t = createTranslator(state.locale)
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [token, setToken] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busyWasRunning, setBusyWasRunning] = useState(false)

  const editing = editingId !== null
  const canSubmit =
    baseUrl.trim().length > 0 && (editing || token.trim().length > 0)
  const canTest = baseUrl.trim().length > 0 && token.trim().length > 0
  const error = state.setupError
  const hasProfiles = state.profiles.length > 0

  useEffect(() => {
    if (state.busy) {
      setBusyWasRunning(true)
      return
    }
    if (!busyWasRunning) return
    setBusyWasRunning(false)
    if (!state.setupError) resetForm()
  }, [state.busy, state.setupError, busyWasRunning])

  function resetForm(): void {
    setEditingId(null)
    setName('')
    setBaseUrl('')
    setToken('')
  }

  function startEditing(profile: ProfileSummary): void {
    setEditingId(profile.id)
    setName(profile.name)
    setBaseUrl(profile.baseUrl)
    setToken('')
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    const profile = {
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      token: token.trim(),
    }
    if (editingId) {
      post({ type: 'updateProfile', profileId: editingId, profile })
    } else {
      post({ type: 'addProfile', profile })
    }
  }

  return (
    <div className='setup-view'>
      <header className='setup-head'>
        <div className='brand'>
          <div className='brand-mark' aria-hidden='true'>
            <ServerIcon width={18} height={18} />
          </div>
          <div className='brand-text'>
            <h1 className='setup-title'>
              {hasProfiles ? t('setup.manageTitle') : t('setup.title')}
            </h1>
            <p className='setup-subtitle'>
              {hasProfiles ? t('setup.manageSubtitle') : t('setup.subtitle')}
            </p>
          </div>
        </div>
        {hasProfiles ? (
          <button
            type='button'
            className='outline-button'
            onClick={() => post({ type: 'openDashboard' })}
          >
            {t('common.back')}
          </button>
        ) : null}
      </header>

      <div className='setup-grid'>
        <form className='panel glass setup-form' onSubmit={handleSubmit}>
          <h2 className='side-heading'>
            {editing ? t('setup.editProfile') : t('setup.newProfile')}
          </h2>

          <div className='field'>
            <label htmlFor='profile-name'>{t('setup.name')}</label>
            <input
              id='profile-name'
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('setup.namePlaceholder')}
              autoComplete='off'
              spellCheck={false}
            />
          </div>

          <div className='field'>
            <label htmlFor='profile-url'>{t('setup.baseUrl')}</label>
            <input
              id='profile-url'
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder={t('setup.baseUrlPlaceholder')}
              autoComplete='off'
              spellCheck={false}
              inputMode='url'
            />
          </div>

          <div className='field'>
            <label htmlFor='profile-token'>{t('setup.token')}</label>
            <input
              id='profile-token'
              type='password'
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder={
                editing ? t('setup.editTokenPlaceholder') : t('setup.tokenPlaceholder')
              }
              autoComplete='new-password'
              spellCheck={false}
            />
            <p className='field-hint'>
              {editing ? t('setup.editHint') : t('setup.tokenHint')}
            </p>
          </div>

          {error ? (
            <div className='inline-error'>
              <AlertIcon width={14} height={14} />
              <div>
                <div>{error.message}</div>
                {error.hint ? <div className='inline-hint'>{error.hint}</div> : null}
              </div>
            </div>
          ) : null}

          {testResult ? (
            <div className={testResult.ok ? 'inline-ok' : 'inline-error'}>
              {testResult.ok ? (
                <CheckIcon width={14} height={14} />
              ) : (
                <AlertIcon width={14} height={14} />
              )}
              <div>{testResult.message}</div>
            </div>
          ) : null}

          <div className='form-actions'>
            {editing ? (
              <button
                type='button'
                className='outline-button'
                onClick={resetForm}
              >
                {t('setup.cancelEdit')}
              </button>
            ) : null}
            <button
              type='button'
              className='outline-button'
              disabled={!canTest}
              onClick={() =>
                post({
                  type: 'testProfile',
                  baseUrl: baseUrl.trim(),
                  token: token.trim(),
                })
              }
            >
              {t('common.test')}
            </button>
            <button
              type='submit'
              className='primary-button'
              disabled={!canSubmit || state.busy}
            >
              {editing ? null : <PlusIcon width={14} height={14} />}
              {state.busy
                ? t('setup.testing')
                : editing
                  ? t('setup.saveChanges')
                  : t('setup.connect')}
            </button>
          </div>
        </form>

        <aside className='panel glass setup-side'>
          <h2 className='side-heading'>{t('setup.profiles')}</h2>
          {hasProfiles ? (
            <div className='profile-list'>
              {state.profiles.map((profile) => {
                const isCurrent = state.profile?.id === profile.id
                const isEditing = editingId === profile.id
                return (
                <div
                  className={`profile-row${isEditing ? ' editing' : ''}${isCurrent ? ' current' : ''}`}
                  key={profile.id}
                >
                  <div className='profile-info'>
                    <div className='profile-name'>
                      {profile.name}
                      {profile.isAdmin ? (
                        <span className='chip admin'>{t('header.admin')}</span>
                      ) : null}
                    </div>
                    <div className='profile-meta'>
                      {profile.displayName || profile.username || profile.baseUrl}
                    </div>
                    <div className='profile-meta mono'>{profile.baseUrl}</div>
                  </div>
                  <div className='profile-actions'>
                    {isCurrent ? (
                      <span className='chip current'>
                        {t('setup.currentProfile')}
                      </span>
                    ) : (
                      <button
                        type='button'
                        className='ghost-button'
                        onClick={() =>
                          post({ type: 'switchProfile', profileId: profile.id })
                        }
                      >
                        {t('setup.useProfile')}
                      </button>
                    )}
                    <button
                      type='button'
                      className='icon-button'
                      title={t('setup.editProfile')}
                      aria-label={t('setup.editProfile')}
                      onClick={() => startEditing(profile)}
                    >
                      <PencilIcon width={14} height={14} />
                    </button>
                    <button
                      type='button'
                      className='icon-button danger'
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                      onClick={() => {
                        post({
                          type: 'deleteProfile',
                          profileId: profile.id,
                        })
                      }}
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
          ) : (
            <p className='muted'>{t('setup.noProfiles')}</p>
          )}

          <section className='appearance-block'>
            <h2 className='side-heading'>{t('theme.label')}</h2>
            <div
              className='theme-options'
              role='group'
              aria-label={t('theme.label')}
            >
              {THEME_MODES.map((mode) => {
                const ThemeIcon = THEME_ICONS[mode]
                const active = state.preferences.themeMode === mode
                return (
                  <button
                    key={mode}
                    type='button'
                    className={`theme-option${active ? ' active' : ''}`}
                    aria-pressed={active}
                    onClick={() =>
                      post({
                        type: 'setPreferences',
                        preferences: { themeMode: mode },
                      })
                    }
                  >
                    <ThemeIcon width={14} height={14} />
                    <span>{t(THEME_LABEL_KEYS[mode])}</span>
                  </button>
                )
              })}
            </div>
            <p className='field-hint'>{t('theme.hint')}</p>

            <h3 className='appearance-subheading'>{t('style.label')}</h3>
            <StyleOptionGroup locale={state.locale} style={state.themeStyle} />
            <p className='field-hint'>{t('style.hint')}</p>
          </section>

          <div className='note-box'>
            <div className='note-title'>{t('setup.securityNote')}</div>
            <div className='note-body'>{t('setup.dataExportNote')}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
