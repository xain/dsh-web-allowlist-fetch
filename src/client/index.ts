/**
 * dsh-web-allowlist-fetch — browser half.
 *
 * Registers the allowlist web_fetch provider's Settings card: an editable
 * allowlist (hosts/IPs that bypass the public-IP guard) surfaced under the
 * Settings → 插件配置 tab. The card is keyed on the `dsh-web-allowlist-fetch`
 * settings namespace, which the Host-side half registers via installSection.
 */

// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the settings shell's ctx.settingsScope Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { AllowlistCard } from './AllowlistCard.tsx'
import { ALLOWLIST_NS, AllowlistCardController } from './allowlist-card-controller.ts'
import { en, zh } from './locales.ts'

export type { AllowlistCardProps } from './AllowlistCard.tsx'
export type {
  AllowlistCardFace, AllowlistCardState, AllowlistSettings,
} from './allowlist-card-controller.ts'
export type { CardActions, CardFieldSpec, CardFieldState, CardShell } from './card-form.ts'
export type { SettingsPluginItemOwnerProps } from './slot-contract.ts'

/** Locale dictionary namespace owned by this plugin. */
const NS = 'allowlist-card'

/** Required services (cordis fiber inject). */
export const inject = [
  'slots', 'locale', 'settingsScope',
]

/**
 * Mount the allowlist card into the plugin configuration surface.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-web-allowlist-fetch: card dictionaries')

  const controller = new AllowlistCardController(
    ctx.settingsScope.bind({ namespace: ALLOWLIST_NS }),
  )

  ctx.slots.inject('settings.plugin.item', function* () {
    yield ctx.slots.register({
      name: 'settings.plugin.item',
      key: ALLOWLIST_NS,
      locale: NS,
      inject: () => controller.inject(),
    }, AllowlistCard)
  })
}