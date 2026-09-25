/**
 * The allowlist provider's settings page: a multi-line editor for the hosts and
 * IPs that bypass the public-IP guard, with a hint naming the accepted entry
 * forms. Rendered inside the Plugins page's `plugins.item` slot.
 */

// Type-only: the Plugins page's SlotMap merge (the 'plugins.item' entry).
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { SettingsForm, SettingsValueField } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { formLabels } from './locales.ts'
import type { AllowlistCardFace } from './allowlist-card-controller.ts'

/** Props the renderer binds for the allowlist page. */
export type AllowlistCardProps =
  PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.allowlist'>
  & InjectFace<AllowlistCardFace>

/**
 * Render the allowlist provider's one-liner or its settings form, as the Plugins page asks.
 * @param props - the view asked for, locale copy, the form snapshot, and its actions.
 * @returns the one-liner, or the form.
 */
export function AllowlistCard(props: AllowlistCardProps) {
  const { t } = props
  const state = props.useAllowlistCard(snapshot => snapshot)
  if (props.view === 'summary') return t('description')
  const disabled = !state.writable
  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label htmlFor="plugin-config-allowlist" style={{ fontWeight: 600 }}>{t('allowlist')}</label>
          {state.allowlist.overridden
            ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{t('overridden')}</span>
                <button type="button" disabled={disabled} onClick={() => { props.resetField('allowlist') }}>
                  {t('reset')}
                </button>
              </span>
            )
            : null}
        </div>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>{t('allowlistHint')}</p>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>{t('allowlistExamples')}</p>
        <textarea
          id="plugin-config-allowlist"
          rows={6}
          spellCheck={false}
          disabled={disabled}
          aria-invalid={state.allowlist.invalid || undefined}
          placeholder={t('allowlistPlaceholder')}
          value={state.allowlist.text}
          onChange={(event) => { props.edit('allowlist', event.target.value) }}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 13,
            lineHeight: 1.5,
            padding: '6px 8px',
            resize: 'vertical',
          }}
        />
        {state.allowlist.invalid
          ? <p style={{ margin: 0, fontSize: 12, color: 'var(--dsw-alias-state-error-primary, #c0392b)' }}>{t('invalid')}</p>
          : null}
      </div>
      <SettingsValueField
        id="plugin-config-allowlist-max-body"
        label={t('maxBodyChars')}
        hint={t('maxBodyCharsHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalid')}
        numeric
        disabled={disabled}
        {...state.maxBodyChars}
        onEdit={(text) => { props.edit('maxBodyChars', text) }}
        onReset={() => { props.resetField('maxBodyChars') }}
      />
    </SettingsForm>
  )
}
