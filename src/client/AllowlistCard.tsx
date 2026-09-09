/**
 * The allowlist provider's card: a multi-line editor for the hosts/IPs that
 * bypass the public-IP guard, with a hint explaining the allowed entry forms.
 */

import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import type { AllowlistCardFace, AllowlistCardState } from './allowlist-card-controller.ts'
import type { AllowlistLocaleKey } from './locales.ts'
import type {} from './slot-contract.ts'

export type AllowlistCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'allowlist-card'>
  & InjectFace<AllowlistCardFace>

/**
 * Render the allowlist card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card.
 */
export function AllowlistCard(props: AllowlistCardProps) {
  const { t } = props
  const state = props.useAllowlistCard((snapshot: AllowlistCardState) => snapshot)
  const [open, setOpen] = useState(false)
  if (!state.available) return null

  const saveDisabled = state.saving || !state.dirty || state.invalid
  return (
    <li style={{ border: '1px solid var(--dsh-border, #33333355)', borderRadius: 8, margin: '8px 0', padding: '10px 14px' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
      >
        <strong>{t('title')}</strong>
        <div style={{ color: '#666', fontSize: 13 }}>{t('description')}</div>
      </button>
      {state.dirty ? <span style={{ color: '#b58900', fontSize: 12 }}>{t('unsaved')}</span> : null}
      {open ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 12, color: '#555', margin: '0 0 4px' }}>{t('hint')}</p>
          <p style={{ fontSize: 12, color: '#777', margin: '0 0 6px', fontStyle: 'italic' }}>{t('examples')}</p>
          <textarea
            aria-label={t('allowlistLabel')}
            spellCheck={false}
            disabled={!state.writable}
            rows={6}
            value={state.allowlist.text}
            onChange={(e) => props.edit('allowlist', e.target.value)}
            style={{ width: '100%', fontFamily: 'monospace', resize: 'vertical' }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" disabled={saveDisabled} onClick={props.save} style={{ cursor: saveDisabled ? 'default' : 'pointer' }}>
              {t('save')}
            </button>
            <button type="button" onClick={props.discard}>{t('discard')}</button>
          </div>
          {state.failed ? <div style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>{t('invalid')}</div> : null}
        </div>
      ) : null}
    </li>
  )
}

export type { AllowlistLocaleKey }