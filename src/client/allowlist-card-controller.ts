/**
 * The allowlist page's staged form over the `web-fetch-allowlist` Host entry.
 *
 * The namespace is the profile entry id (DSH 0.1.7 projects every plugin's
 * `.volatile()` Config fields into a form keyed by that id); no settings
 * namespace is registered by the plugin itself.
 */

// Type-only: pulls the ctx.configForms Context merge into this program.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  SettingsFormModel,
  settingsNumberField,
  type SettingsFieldSpec,
  type SettingsFieldState,
  type SettingsFormActions,
  type SettingsFormScope,
  type SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'

/**
 * Host entry id this page edits. Spelled here rather than imported: a client
 * package must not depend on a Host package. Matches the `id` in this bundle's
 * `cordis.patch.yml`.
 */
export const ALLOWLIST_NS = 'web-fetch-allowlist'

/** The allowlist section this page edits. */
export interface AllowlistSettings {
  /** Hosts/IPs that bypass the public-IP guard, one entry per element. */
  allowlist?: string[]
  /** Max decoded characters returned for an allowlisted host. */
  maxBodyChars?: number
}

/**
 * A multi-line allowlist field: one entry per line. An empty block clears the
 * field; non-empty lines are trimmed and written as an array of strings.
 * @param field - field name inside the section.
 * @returns the field's conversion spec.
 */
function arrayLinesField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => Array.isArray(value) ? (value as unknown[]).map(String).join('\n') : '',
    parse: (text) => {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
      return lines.length === 0 ? { kind: 'clear' } : { kind: 'set', value: lines }
    },
  }
}

/** What the allowlist page renders. */
export interface AllowlistCardState extends SettingsFormShell {
  /** Multi-line draft of the allowlist (one entry per line). */
  allowlist: SettingsFieldState
  /** Draft of the decoded-body cap. */
  maxBodyChars: SettingsFieldState
}

/** The registration-side face the allowlist page's slot entry injects. */
export interface AllowlistCardFace extends SettingsFormActions {
  hooks: {
    /** Page snapshot bound by the renderer as useAllowlistCard. */
    allowlistCard: SnapshotStore<AllowlistCardState>
  }
}

/** Bridges the `web-fetch-allowlist` entry's form onto the page. */
export class AllowlistCardController {
  private readonly form: SettingsFormModel<AllowlistSettings>
  private readonly store: SnapshotStore<AllowlistCardState>

  /**
   * @param scope - the shared configuration form for the `web-fetch-allowlist` entry.
   */
  constructor(scope: SettingsFormScope<AllowlistSettings>) {
    this.form = new SettingsFormModel(scope, [
      arrayLinesField('allowlist'),
      settingsNumberField('maxBodyChars'),
    ])
    this.store = this.form.bind(() => ({
      ...this.form.shell(),
      allowlist: this.form.field('allowlist'),
      maxBodyChars: this.form.field('maxBodyChars'),
    }))
  }

  /** Release the form's accepted-value subscription. */
  dispose(): void {
    this.form.dispose()
  }

  /**
   * Build the face the page's slot registration injects.
   * @returns the page snapshot and its form actions.
   */
  inject(): AllowlistCardFace {
    return { hooks: { allowlistCard: this.store }, ...this.form.actions() }
  }
}
