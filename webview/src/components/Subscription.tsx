import { useState } from 'react'
import { createTranslator } from '../../../src/shared/i18n'
import type {
  DashboardViewModel,
  SubscriptionCardViewModel,
} from '../../../src/shared/types'
import { post } from '../vscodeApi'
import { ChevronDownIcon, CrownIcon, ExternalLinkIcon } from './Icons'

const EXPANDED_STORAGE_KEY = 'lyNewApi.subscription.expanded'

function readExpanded(): boolean {
  try {
    const stored = window.localStorage.getItem(EXPANDED_STORAGE_KEY)
    return stored === null ? true : stored === '1'
  } catch {
    return true
  }
}

function SubscriptionBody({
  card,
  locale,
}: {
  card: SubscriptionCardViewModel
  locale: DashboardViewModel['locale']
}) {
  const t = createTranslator(locale)
  const endLabel =
    card.status === 'active'
      ? t('subscription.until')
      : card.status === 'cancelled'
        ? t('subscription.cancelledAt')
        : t('subscription.expiredAt')

  return (
    <article className='sub-card'>
      <div className='sub-top'>
        <div className='sub-name'>
          {card.planTitle ? (
            <strong>{card.planTitle}</strong>
          ) : null}
          <span className='sub-id'>
            {t('subscription.id', { id: card.id })}
          </span>
          <span className={`pill ${card.status}`}>
            {card.status === 'active'
              ? t('subscription.active')
              : card.status === 'cancelled'
                ? t('subscription.cancelled')
                : t('subscription.expired')}
          </span>
        </div>
        {card.status === 'active' ? (
          <span className='sub-days'>
            {t('subscription.remainingDays', { n: card.remainingDays })}
          </span>
        ) : null}
      </div>

      <div className='sub-meta'>
        {endLabel} {card.endTimeText}
      </div>
      {card.nextResetText ? (
        <div className='sub-meta'>
          {t('subscription.nextReset')}: {card.nextResetText}
        </div>
      ) : null}

      <div className='sub-quota'>
        <span className='sub-label'>{t('subscription.totalQuota')}:</span>
        {card.unlimited ? (
          <span>{t('common.unlimited')}</span>
        ) : (
          <>
            <span className='mono'>
              {card.quotaUsedText}/{card.quotaTotalText}
            </span>
            <span className='sub-remaining'>
              {t('subscription.remaining')} {card.quotaRemainingText}
            </span>
            <span className='sub-percent'>
              {t('subscription.usedPercent', { n: card.usedPercent })}
            </span>
          </>
        )}
      </div>

      {!card.unlimited ? (
        <div className='progress'>
          <span style={{ width: `${card.usedPercent}%` }} />
        </div>
      ) : null}
    </article>
  )
}

export function SubscriptionSection({ state }: { state: DashboardViewModel }) {
  const [expanded, setExpanded] = useState(readExpanded)
  const t = createTranslator(state.locale)
  const subscription = state.subscription

  if (!subscription || !subscription.available) return null
  if (!subscription.hasAny && !subscription.siteUrl) return null

  const toggle = () => {
    setExpanded((previous) => {
      const next = !previous
      try {
        window.localStorage.setItem(EXPANDED_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // localStorage can be unavailable in hardened webviews.
      }
      return next
    })
  }

  return (
    <section className='panel glass subscription-panel'>
      <header className='panel-header'>
        <div className='panel-title-group'>
          <span className='panel-icon tone-warning'>
            <CrownIcon width={15} height={15} />
          </span>
          <h2 className='panel-title'>{t('subscription.title')}</h2>
          {subscription.activeCount > 0 ? (
            <span className='badge success'>
              <span className='dot' />
              {t('subscription.activeCount', { n: subscription.activeCount })}
            </span>
          ) : (
            <span className='badge muted'>{t('subscription.noActive')}</span>
          )}
          {subscription.expiredCount > 0 ? (
            <span className='badge muted'>
              {t('subscription.expiredCount', { n: subscription.expiredCount })}
            </span>
          ) : null}
          {subscription.billingPreferenceLabel ? (
            <span className='chip'>
              {t('subscription.preference')}:{' '}
              {subscription.billingPreferenceLabel}
            </span>
          ) : null}
        </div>
        <div className='panel-actions'>
          {subscription.siteUrl ? (
            <button
              type='button'
              className='ghost-button'
              onClick={() =>
                post({ type: 'openExternal', url: subscription.siteUrl })
              }
            >
              <ExternalLinkIcon width={13} height={13} />
              {t('subscription.openSite')}
            </button>
          ) : null}
          <button
            type='button'
            className='icon-button'
            onClick={toggle}
            title={
              expanded
                ? t('subscription.collapse')
                : t('subscription.expand')
            }
          >
            <ChevronDownIcon
              className={expanded ? 'chevron rotated' : 'chevron'}
            />
          </button>
        </div>
      </header>

      {expanded ? (
        <div className='panel-body subscription-body'>
          {subscription.cards.length === 0 ? (
            <div className='sub-empty'>{t('subscription.noActive')}</div>
          ) : (
            subscription.cards.map((card) => (
              <SubscriptionBody
                key={card.id}
                card={card}
                locale={state.locale}
              />
            ))
          )}

          {subscription.expiredCards.length > 0 ? (
            <details className='expired-block'>
              <summary>
                {t('subscription.expiredCount', {
                  n: subscription.expiredCards.length,
                })}
              </summary>
              <div className='expired-list'>
                {subscription.expiredCards.map((card) => (
                  <SubscriptionBody
                    key={card.id}
                    card={card}
                    locale={state.locale}
                  />
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
