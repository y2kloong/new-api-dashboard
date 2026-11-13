import { useEffect, useState, type KeyboardEvent } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { createTranslator } from '../../../../src/shared/i18n'
import {
  formatDateTimeMinute,
  replaceLocalDay,
  replaceLocalTime,
} from '../../../../src/shared/time'
import type { Locale } from '../../../../src/shared/types'
import { CalendarIcon } from '../Icons'
import { Calendar } from './calendar'
import { Input } from './input'
import { usePortalContainer } from './portal'

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

/** Two-digit hour or minute field; commits a clamped value while typing. */
function TimePartInput({
  value,
  max,
  label,
  onChange,
}: {
  value: number
  max: number
  label: string
  onChange: (next: number) => void
}) {
  const [draft, setDraft] = useState(pad2(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(pad2(value))
  }, [value, focused])

  const commit = () => {
    const parsed = Number(draft)
    const clamped = Number.isFinite(parsed)
      ? Math.min(max, Math.max(0, Math.trunc(parsed)))
      : value
    setDraft(pad2(clamped))
    if (clamped !== value) onChange(clamped)
  }

  const handleChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 2)
    setDraft(digits)
    if (digits === '') return
    const parsed = Number(digits)
    if (parsed > max) {
      // A two-digit value can only be a finished entry; a one-digit value can
      // still grow into a valid one (1 → 12), so wait for the second digit.
      if (digits.length === 2) {
        setDraft(pad2(max))
        onChange(max)
      }
      return
    }
    onChange(parsed)
  }

  const stepBy = (step: number) => {
    const next = (value + step + max + 1) % (max + 1)
    setDraft(pad2(next))
    onChange(next)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
      return
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      stepBy(event.key === 'ArrowUp' ? 1 : -1)
    }
  }

  return (
    <Input
      className='ui-time-input'
      value={draft}
      inputMode='numeric'
      maxLength={2}
      aria-label={label}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        commit()
        setFocused(false)
      }}
      onKeyDown={handleKeyDown}
    />
  )
}

interface DateTimePickerProps {
  id?: string
  value: number
  onChange: (next: number) => void
  locale: Locale
}

/**
 * Date and time picker in the shadcn date-picker shape: a button styled like an
 * input opens a popover with the month grid and a two-field clock.
 */
export function DateTimePicker({
  id,
  value,
  onChange,
  locale,
}: DateTimePickerProps) {
  const t = createTranslator(locale)
  const [open, setOpen] = useState(false)
  const container = usePortalContainer()
  const date = new Date(value * 1000)
  const hours = date.getHours()
  const minutes = date.getMinutes()

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button type='button' id={id} className='ui-date-trigger'>
          <span className='ui-date-value'>
            {formatDateTimeMinute(value, locale)}
          </span>
          <CalendarIcon width={15} height={15} className='ui-date-icon' />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={container ?? undefined}>
        <PopoverPrimitive.Content
          className='ui-popover ui-datetime-popover'
          sideOffset={6}
          align='start'
          collisionPadding={12}
        >
          <Calendar
            locale={locale}
            selected={date}
            defaultMonth={date}
            onSelect={(day) => {
              if (day) onChange(replaceLocalDay(value, day))
            }}
          />
          <div className='ui-datetime-time'>
            <TimePartInput
              value={hours}
              max={23}
              label={t('filter.hourUnit')}
              onChange={(next) => onChange(replaceLocalTime(value, next, minutes))}
            />
            <span className='ui-time-separator'>:</span>
            <TimePartInput
              value={minutes}
              max={59}
              label={t('filter.minuteUnit')}
              onChange={(next) => onChange(replaceLocalTime(value, hours, next))}
            />
            <button
              type='button'
              className='ui-time-now'
              onClick={() => onChange(Math.floor(Date.now() / 1000))}
            >
              {t('filter.now')}
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
