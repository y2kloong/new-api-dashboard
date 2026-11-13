import { createTranslator } from '../../../src/shared/i18n'
import type { LanguagePreference, Locale } from '../../../src/shared/types'
import { post } from '../vscodeApi'
import { GlobeIcon, MonitorIcon } from './Icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export const LANGUAGE_OPTIONS: LanguagePreference[] = ['auto', 'zh', 'en']

const LANGUAGE_LABEL_KEYS = {
  auto: 'language.auto',
  zh: 'language.zh',
  en: 'language.en',
} as const

const LANGUAGE_ICONS = {
  auto: MonitorIcon,
  zh: GlobeIcon,
  en: GlobeIcon,
} as const

function setLanguage(language: LanguagePreference): void {
  post({ type: 'setLanguage', language })
}

/** Compact dropdown used in the side bar settings. */
export function LanguageSelect({
  locale,
  language,
  className,
}: {
  locale: Locale
  language: LanguagePreference
  className?: string
}) {
  const t = createTranslator(locale)

  return (
    <Select
      value={language}
      onValueChange={(next) => setLanguage(next as LanguagePreference)}
    >
      <SelectTrigger
        size='sm'
        className={
          className ? `language-select ${className}` : 'language-select'
        }
        aria-label={t('language.label')}
        title={t('language.label')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {t(LANGUAGE_LABEL_KEYS[option])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Full option group used on the configuration page, next to the other appearance pickers. */
export function LanguageOptionGroup({
  locale,
  language,
}: {
  locale: Locale
  language: LanguagePreference
}) {
  const t = createTranslator(locale)

  return (
    <div className='theme-options' role='group' aria-label={t('language.label')}>
      {LANGUAGE_OPTIONS.map((option) => {
        const Icon = LANGUAGE_ICONS[option]
        const active = language === option
        return (
          <button
            key={option}
            type='button'
            className={`theme-option${active ? ' active' : ''}`}
            aria-pressed={active}
            onClick={() => setLanguage(option)}
          >
            <Icon width={14} height={14} />
            <span>{t(LANGUAGE_LABEL_KEYS[option])}</span>
          </button>
        )
      })}
    </div>
  )
}
