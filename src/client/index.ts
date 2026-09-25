/**
 * dsh-web-allowlist-fetch — browser half.
 *
 * Registers the allowlist provider's settings page into the Plugins page's
 * `plugins.item` slot while the Host serves the `web-fetch-allowlist` entry.
 * DSH 0.1.7 projects every plugin's `.volatile()` Config fields into a form
 * keyed by the profile entry id; this page is that form's editor.
 */

// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the ctx.configForms Context merge. Cross-plugin collaboration
// goes through the service, never a value import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the Plugins page's SlotMap merge (the 'plugins.item' entry).
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { AllowlistCard } from './AllowlistCard.tsx'
import { ALLOWLIST_NS, AllowlistCardController } from './allowlist-card-controller.ts'
import { en, zh, type AllowlistLocaleKey } from './locales.ts'

export type { AllowlistCardProps } from './AllowlistCard.tsx'
export type { AllowlistCardFace, AllowlistCardState, AllowlistSettings } from './allowlist-card-controller.ts'
export type { AllowlistLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Allowlist settings page copy. */
    'settings.allowlist': AllowlistLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.allowlist'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Mount the allowlist settings page while the Host serves its entry.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-web-allowlist-fetch: dictionaries')

  const card = new AllowlistCardController(ctx.configForms.get(ALLOWLIST_NS))
  ctx.effect(() => () => { card.dispose() }, 'dsh-web-allowlist-fetch: form subscription')

  // The page appears only while the Host serves this entry, so a deployment
  // without the provider shows no trace of it.
  ctx.effect(
    () => ctx.configForms.whileServed([ALLOWLIST_NS], () => ctx.slots.inject('plugins.item', () => ctx.slots.register({
      name: 'plugins.item',
      id: 'web-allowlist-fetch',
      order: 50,
      label: () => t('title'),
      locale: NS,
      inject: () => card.inject(),
    }, AllowlistCard))),
    'dsh-web-allowlist-fetch: page',
  )
}
