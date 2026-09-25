/**
 * Bilingual copy for the allowlist settings page, plus the labels the shared
 * `SettingsForm` frame renders.
 */

import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** The dictionary namespace these keys live under. */
export const NS = 'settings.allowlist'

/** English copy. */
export const en = {
  title: 'Web fetch allowlist',
  description: 'Hosts/IPs web_fetch may reach without the public-IP safety check.',
  allowlist: 'Allowlist',
  allowlistHint: 'One entry per line. Allowed forms: a bare domain (also matches its subdomains), a wildcard like *.example.com, an IP literal, or a CIDR network such as 198.18.0.0/15.',
  allowlistExamples: 'Examples: example.com, *.example.com, 192.168.1.10, 198.18.0.0/15, 2001:db8::/32',
  allowlistPlaceholder: 'example.com\n198.18.0.0/15',
  maxBodyChars: 'Max body characters',
  maxBodyCharsHint: 'Decoded body cap for an allowlisted host.',
  overridden: 'overridden',
  reset: 'Reset',
  invalid: 'invalid',
  unavailable: 'This plugin is not served in this deployment.',
  readOnly: 'This configuration document is read-only.',
  saveFailed: 'The Host rejected the last save; your edits are kept.',
  save: 'Save',
  saving: 'Saving…',
} as const

/** Simplified Chinese copy. */
export const zh = {
  title: '网页抓取放行列表',
  description: 'web_fetch 无需公共 IP 安全检查即可访问的域名/IP。',
  allowlist: '放行列表',
  allowlistHint: '每行一个主机或 IP。支持的格式：裸域名（同时匹配其子域）、通配符如 *.example.com、IP 字面量、或 CIDR 网段如 198.18.0.0/15。',
  allowlistExamples: '示例：example.com、*.example.com、192.168.1.10、198.18.0.0/15、2001:db8::/32',
  allowlistPlaceholder: 'example.com\n198.18.0.0/15',
  maxBodyChars: '最大正文字符数',
  maxBodyCharsHint: '放行主机返回的最大解码字符数。',
  overridden: '已覆盖',
  reset: '重置',
  invalid: '无效',
  unavailable: '本部署未提供该插件。',
  readOnly: '该配置文档为只读。',
  saveFailed: 'Host 拒绝了上次保存；你的编辑已保留。',
  save: '保存',
  saving: '保存中…',
} as const

/** Locale key union for this page's copy. */
export type AllowlistLocaleKey = keyof typeof en

/**
 * Build the labels the shared settings form frame renders.
 * @param t - the page's locale reader.
 * @returns the labels for `SettingsForm`.
 */
export function formLabels(t: (key: AllowlistLocaleKey) => string): SettingsFormLabels {
  return {
    unavailable: t('unavailable'),
    readOnly: t('readOnly'),
    saveFailed: t('saveFailed'),
    save: t('save'),
    saving: t('saving'),
  }
}
