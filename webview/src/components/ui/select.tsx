import type { ComponentPropsWithoutRef } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '../../lib/cn'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '../Icons'
import { usePortalContainer } from './portal'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
  size?: 'default' | 'sm'
}) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'ui-select-trigger',
        size === 'sm' && 'ui-select-trigger-sm',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon width={14} height={14} className='ui-select-chevron' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  const container = usePortalContainer()
  return (
    <SelectPrimitive.Portal container={container ?? undefined}>
      <SelectPrimitive.Content
        className={cn('ui-select-content', className)}
        position={position}
        sideOffset={4}
        collisionPadding={8}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className='ui-select-scroll'>
          <ChevronUpIcon width={14} height={14} />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className='ui-select-viewport'>
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className='ui-select-scroll'>
          <ChevronDownIcon width={14} height={14} />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn('ui-select-item', className)}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className='ui-select-indicator'>
        <CheckIcon width={13} height={13} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
