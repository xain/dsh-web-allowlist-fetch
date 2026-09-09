/**
 * The allowlist card's staged form over the `dsh-web-allowlist-fetch` settings
 * namespace.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the ctx.settingsScope Context merge into this program.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  CardForm, arrayLinesField,
  type CardActions, type CardFieldState, type CardShell,
} from './card-form.ts'

/**
 * Namespace of the allowlist provider. Spelled here rather than imported: a
 * client package must not depend on a Host package. Matches the Host-side
 * `DSH_WEB_ALLOWLIST_FETCH_SETTINGS_NAMESPACE` constant.
 */
export const ALLOWLIST_NS = 'dsh-web-allowlist-fetch'

/** The allowlist section a card edits. */
export interface AllowlistSettings {
  /** Hosts/IPs that bypass the public-IP guard, one entry per element. */
  allowlist?: string[]
  /** Max decoded characters returned for an allowlisted host. */
  maxBodyChars?: number
}

/** What the allowlist card renders. */
export interface AllowlistCardState extends CardShell {
  /** Multi-line draft of the allowlist (one entry per line). */
  allowlist: CardFieldState
}

/** The registration-side face the allowlist card's slot entry injects. */
export interface AllowlistCardFace extends CardActions {
  hooks: {
    /** Card snapshot bound by the renderer as useAllowlistCard. */
    allowlistCard: SnapshotStore<AllowlistCardState>
  }
}

/** Bridges the allowlist settings scope onto the card. */
export class AllowlistCardController {
  private readonly form: CardForm<AllowlistSettings>
  private readonly store: SnapshotStore<AllowlistCardState>

  /**
   * @param scope - the bound settings scope for the `dsh-web-allowlist-fetch` namespace.
   */
  constructor(private readonly scope: SettingsScope<AllowlistSettings>) {
    this.form = new CardForm(scope, [arrayLinesField('allowlist')])
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): AllowlistCardState {
    return {
      ...this.form.shell(),
      allowlist: this.form.field('allowlist'),
    }
  }

  /**
   * Build the face the card's slot registration injects.
   * @returns the card's snapshot and its form actions.
   */
  inject(): AllowlistCardFace {
    return { hooks: { allowlistCard: this.store }, ...this.form.actions() }
  }
}

export type { ClientContext }