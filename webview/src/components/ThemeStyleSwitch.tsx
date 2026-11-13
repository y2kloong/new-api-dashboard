import { createTranslator } from '../../../src/shared/i18n'
import type { Locale, ThemeStyle } from '../../../src/shared/types'
import { THEME_STYLE_LABEL_KEYS, THEME_STYLES } from '../lib/theme'
import { post } from '../vscodeApi'
import { MinimalIcon, PixelGlassIcon, PixelGridIcon } from './Icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const STYLE_ICONS = {
  glass: PixelGlassIcon,
  pixel: PixelGridIcon,
  shadcn: MinimalIcon,
} as const

function setThemeStyle(style: ThemeStyle): void {
  post({ type: 'setPreferences', preferences: { themeStyle: style } })
}

/**
 * Dropdown used on the dashboard header and in the side bar settings. A select
 * scales to any number of skins (a toggle would cycle through them blindly) and
 * keeps native keyboard and screen-reader behaviour.
 */
export function StyleSelect({
  locale,
  style,
  className,
}: {
  locale: Locale
  style: ThemeStyle
  className?: string
}) {
  const t = createTranslator(locale)

  return (
    <Select
      value={style}
      onValueChange={(next) => setThemeStyle(next as ThemeStyle)}
    >
      <SelectTrigger
        size='sm'
        className={className ? `style-select ${className}` : 'style-select'}
        aria-label={t('style.label')}
        title={t('style.label')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {THEME_STYLES.map((option) => (
          <SelectItem key={option} value={option}>
            {t(THEME_STYLE_LABEL_KEYS[option])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Full option group used on the configuration page, next to the colour modes. */
export function StyleOptionGroup({
  locale,
  style,
}: {
  locale: Locale
  style: ThemeStyle
}) {
  const t = createTranslator(locale)

  return (
    <div className='theme-options' role='group' aria-label={t('style.label')}>
      {THEME_STYLES.map((option) => {
        const Icon = STYLE_ICONS[option]
        const active = style === option
        return (
          <button
            key={option}
            type='button'
            className={`theme-option${active ? ' active' : ''}`}
            aria-pressed={active}
            onClick={() => setThemeStyle(option)}
          >
            <Icon width={14} height={14} />
            <span>{t(THEME_STYLE_LABEL_KEYS[option])}</span>
          </button>
        )
      })}
    </div>
  )
}
