import type { PropsBase, PropsSingle } from 'react-day-picker'
import { DayPicker } from 'react-day-picker'
import { enUS } from 'react-day-picker/locale/en-US'
import { zhCN } from 'react-day-picker/locale/zh-CN'
import type { Locale } from '../../../../src/shared/types'
import { cn } from '../../lib/cn'

type CalendarProps = Omit<PropsBase & PropsSingle, 'locale' | 'mode'> & {
  locale: Locale
}

/** Single-day calendar with the locale mapped from the dashboard language. */
export function Calendar({ locale, className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn('ui-calendar', className)}
      mode='single'
      locale={locale === 'zh' ? zhCN : enUS}
      showOutsideDays
      fixedWeeks
      {...props}
    />
  )
}
