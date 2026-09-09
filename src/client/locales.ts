/**
 * Bilingual copy for the allowlist card (a live dictionary namespace owned by
 * this bundle, registered through `ctx.locale.register`).
 */

/** The dictionary namespace these keys live under. */
export const NS = 'allowlist-card'

/** English dictionary. */
export const en = {
  title: 'Allowlist web fetch',
  description: 'Hosts/IPs web_fetch may reach without the public-IP safety check.',
  hint: 'Enter one host or IP per line. Allowed forms: a bare domain (matches its subdomains), a wildcard like *.example.com, an IP literal, or a CIDR network such as 198.18.0.0/15.',
  examples: 'Examples: example.com, *.example.com, 192.168.1.10, 198.18.0.0/15, 2001:db8::/32',
  allowlistLabel: 'Allowlist',
  allowlistHint: 'One entry per line. Only these hosts/IPs bypass the public-IP guard.',
  save: 'Save',
  discard: 'Discard',
  reset: 'Reset',
  overridden: 'overridden',
  unsaved: 'unsaved',
  expand: 'Expand',
  collapse: 'Collapse',
  invalid: 'invalid',
} as const

/** Simplified Chinese dictionary. */
export const zh = {
  title: '放行列表 网页抓取',
  description: 'web_fetch 无需公共 IP 安全检查即可访问的域名/IP。',
  hint: '每行一个主机或 IP。支持的格式：裸域名（同时匹配其子域）、通配符如 *.example.com、IP 字面量、或 CIDR 网段如 198.18.0.0/15。',
  examples: '示例：example.com、*.example.com、192.168.1.10、198.18.0.0/15、2001:db8::/32',
  allowlistLabel: '放行列表',
  allowlistHint: '每行一条。仅这些域名/IP 绕过公共 IP 检查。',
  save: '保存',
  discard: '丢弃',
  reset: '重置',
  overridden: '已覆盖',
  unsaved: '未保存',
  expand: '展开',
  collapse: '收起',
  invalid: '无效',
} as const

/** Locale key union for this card's copy. */
export type AllowlistLocaleKey = keyof typeof en