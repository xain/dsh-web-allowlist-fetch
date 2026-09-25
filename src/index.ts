/**
 * dsh-web-allowlist-fetch — an IP/domain allowlist `WebFetchProvider` for the
 * DeepSeek Harness web capability seam (`ctx.web`).
 *
 * Why it exists: the stock `http` fetch provider rejects every host that
 * resolves to a non-public IP (`isPublicIpAddress` → `unicast` only). In
 * proxy environments that use RFC 2544 fake-IP (Clash/Surge/TUN, address range
 * `198.18.0.0/15`), normal public domains resolve to a fake, non-public IP and
 * get blocked, so `web_fetch` cannot reach otherwise-fine sites.
 *
 * This provider keeps that safety model but adds an explicit escape hatch:
 * - Hosts (domains / wildcard suffixes / IP literals) or IP CIDR ranges listed
 *   in `config.allowlist` are fetched directly with plain `fetch()`, bypassing
 *   the public-IP guard (so a fake-IP address is fine when its domain or the
 *   fake IP range is allowlisted).
 * - Every other host is validated with the same non-public-IP rejection the
 *   stock provider applies, so the default posture is unchanged.
 *
 * Provider id: `allowlist`. The allowlist is a `.volatile()` Config field, so
 * the Loader exposes it on the Settings → 插件配置 surface (auto-generated from
 * this plugin's Config schema) and hands `apply` live references; a committed
 * profile edit applies to the next fetch without remounting. The composed base
 * comes from this bundle's `cordis.patch.yml`.
 */
import z from '@deepseek-ai/schemastery';
import type { Context, Volatile } from '@deepseek-ai/cordis';
import type {
  WebFetchBody,
  WebFetchProvider,
  WebFetchRequest,
  WebFetchResult,
} from '@deepseek-ai/dsh-web';

//#region constants
/** Stable id this provider registers under. */
export const ALLOWLIST_FETCH_PROVIDER_ID = 'allowlist';
/** Default user-agent advertised on direct fetches. */
const USER_AGENT = 'deepseek-harness-web-allowlist-fetch/0.1.0';
/** Cap on decoded body characters returned for allowlisted hosts. */
const DEFAULT_MAX_BODY_CHARS = 200_000;
//#endregion

/**
 * Plugin config: the explicit allowlist plus bounds.
 *
 * Both fields are `.volatile()`: the Loader hands `apply` live references and
 * commits profile edits in place, so a saved change applies without remounting.
 * `resolveConfig` unwraps those references on every read.
 */
export interface Config {
  /**
   * Host/IP/CIDR entries that may be fetched without the public-IP guard.
   * Supports bare domains (also match subdomains), `.example.com`, `*.example.com`,
   * IP literals, and CIDR networks such as `198.18.0.0/15`.
   */
  allowlist: Volatile<string[]>;
  /** Max decoded characters returned for an allowlisted host. */
  maxBodyChars: Volatile<number>;
}

export const Config = z.object({
  allowlist: z.array(z.string())
    .description('放行列表：每行一个主机或 IP。支持裸域名（同时匹配其子域）、通配符如 *.example.com、IP 字面量、或 CIDR 网段如 198.18.0.0/15。仅这些域名/IP 绕过公共 IP 安全检查。')
    .default([])
    .volatile(),
  maxBodyChars: z.number()
    .description('放行主机返回的最大解码字符数。')
    .default(DEFAULT_MAX_BODY_CHARS)
    .volatile(),
});

/** Resolved (unwrapped) config the fetch provider reads. */
type ResolvedConfig = { allowlist: string[]; maxBodyChars: number };

/**
 * Unwrap the live `Volatile<T>` references the Loader passes for `.volatile()`
 * fields into a plain object, once per read.
 *
 * @param config - the live plugin config handed to `apply`.
 * @returns a detached plain object of current values.
 */
function resolveConfig(config: Config): ResolvedConfig {
  return {
    allowlist: config.allowlist.get(),
    maxBodyChars: config.maxBodyChars.get(),
  };
}

//#region IP / CIDR helpers (no external dependency)
/** 4 for IPv4, 6 for IPv6, 0 when not an IP literal. */
export function ipFamily(text: string): 4 | 6 | 0 {
  const trimmed = text.trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmed)) {
    if (trimmed.split('.').every((p) => Number(p) <= 255)) return 4;
    return 0;
  }
  if (/^[0-9a-f:]+$/i.test(trimmed) && trimmed.includes(':')) return 6;
  return 0;
}

/** Normalize an IP literal (lowercase, strip IPv6 brackets and zone id). */
export function normalizeIp(address: string): string {
  let s = address.split('%')[0]!.trim();
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1);
  return s.toLowerCase();
}

/** Parse an IP literal into a bit array (length 32 for IPv4, 128 for IPv6). */
function parseBits(address: string, family: 4 | 6): Uint8Array | undefined {
  const a = normalizeIp(address);
  if (family === 4) {
    const parts = a.split('.');
    if (parts.length !== 4) return undefined;
    const bytes = parts.map((p) => Number(p));
    if (bytes.some((b) => !Number.isInteger(b) || b < 0 || b > 255)) return undefined;
    const bits = new Uint8Array(32);
    bytes.forEach((byte, bi) => {
      for (let bit = 0; bit < 8; bit++) bits[bi * 8 + bit] = (byte >> (7 - bit)) & 1;
    });
    return bits;
  }
  // IPv6: support `::` compression. Reject embedded dotted-quad after `::` for simplicity.
  if (a.includes('.')) return undefined;
  const hextets: string[] = [];
  const doubleColon = a.indexOf('::');
  if (doubleColon !== -1) {
    const left = a.slice(0, doubleColon).split(':').filter(Boolean);
    const right = a.slice(doubleColon + 2).split(':').filter(Boolean);
    const fill = 8 - left.length - right.length;
    if (fill < 1) return undefined;
    hextets.push(...left, ...Array.from({ length: fill }, () => '0'), ...right);
  } else {
    hextets.push(...a.split(':'));
  }
  if (hextets.length !== 8) return undefined;
  const bits = new Uint8Array(128);
  for (let hi = 0; hi < 8; hi++) {
    const value = Number.parseInt(hextets[hi] || '0', 16);
    if (Number.isNaN(value)) return undefined;
    for (let bit = 0; bit < 16; bit++) bits[hi * 16 + bit] = (value >> (15 - bit)) & 1;
  }
  return bits;
}

/** True when `base` and `target` (same family) share the first `prefix` bits. */
function bitsMatchPrefix(base: Uint8Array, target: Uint8Array, prefix: number): boolean {
  const bits = base.length;
  if (target.length !== bits) return false;
  if (prefix > bits) prefix = bits;
  for (let i = 0; i < prefix; i++) {
    if (base[i] !== target[i]) return false;
  }
  return true;
}

/**
 * Whether the `network/prefix` CIDR contains `address`. Both must be the same
 * family; an address in the other family is never contained.
 */
export function cidrContains(
  network: string,
  prefix: number,
  address: string,
): boolean {
  const family = ipFamily(network);
  if (family === 0 || ipFamily(address) !== family) return false;
  const base = parseBits(network, family);
  const target = parseBits(address, family);
  if (!base || !target) return false;
  return bitsMatchPrefix(base, target, prefix);
}
//#endregion

//#region public-IP guard (mirrors stock `http` provider)
/** IPv4 and IPv6 private / special-use networks treated as non-public. */
const NON_PUBLIC_RANGES: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
  ['255.255.255.255', 32],
];

/** True when the given textual IP is not globally reachable unicast. */
export function isNonPublicAddress(address: string): boolean {
  const family = ipFamily(address);
  if (family === 0) return true;
  return NON_PUBLIC_RANGES.some(([network, prefix]) =>
    cidrContains(network, prefix, address),
  );
}
//#endregion

//#region allowlist matching
/** One compiled allowlist matcher. */
interface HostMatcher {
  readonly source: string;
  matches(host: string, addresses: readonly string[]): boolean;
}

/**
 * Compile a configured allowlist entry into a matcher.
 *
 * @param entry - the string entered by the user; backend-module protocol.
 */
export function compileEntry(entry: string): HostMatcher {
  const source = entry.trim();

  // CIDR network.
  const slash = source.indexOf('/');
  if (slash !== -1) {
    const network = source.slice(0, slash);
    const prefix = Number(source.slice(slash + 1));
    const family = ipFamily(network);
    if (family !== 0 && Number.isInteger(prefix) && prefix >= 0) {
      const host = parseBits(network, family);
      const max = family === 4 ? 32 : 128;
      if (host && prefix <= max) {
        return {
          source,
          matches: (_host, addresses) =>
            addresses.some((address) => cidrContains(network, prefix, address)),
        };
      }
    }
  }

  // IP literal.
  if (ipFamily(source) !== 0) {
    const literal = normalizeIp(source);
    return {
      source,
      matches: (_host, addresses) => addresses.includes(literal),
    };
  }

  // Hostname pattern.
  const needle = source.toLowerCase();
  const wildcard = needle.startsWith('*.');
  const dotted = needle.startsWith('.');
  // Strip a leading `*.` (wildcard) or `.` (dotted); both yield the bare domain.
  const core = wildcard ? needle.slice(2) : dotted ? needle.slice(1) : needle;
  return {
    source,
    matches: (host, _addresses) => {
      const h = host.toLowerCase();
      // A wildcard `*.example.com` requires at least one subdomain label;
      // bare / dotted forms also match the apex itself.
      if (!wildcard && h === core) return true;
      if (h.endsWith(`.${core}`)) return true;
      return false;
    },
  };
}

//#endregion

//#region provider
/**
 * Build the allowlist fetch provider.
 *
 * @param getResolved - thunk returning the currently authoritative config; the
 *   provider recompiles matchers on every fetch so a committed settings change
 *   applies without re-registering.
 */
export function createAllowlistFetchProvider(
  getResolved: () => ResolvedConfig,
): WebFetchProvider {
  return {
    id: ALLOWLIST_FETCH_PROVIDER_ID,
    available: () => true,
    fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
      const resolved = getResolved();
      const matchers = resolved.allowlist.map(compileEntry);
      return fetchAllowlisted(request.url, matchers, resolved.maxBodyChars, signal);
    },
  };
}

/** Parse and validate an `http(s)` URL, throwing a descriptive Error otherwise. */
function parseHttpUrl(input: string): URL {
  const url = new URL(input);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `web-allowlist-fetch: unsupported protocol "${url.protocol}" (only http/https)`,
    );
  }
  return url;
}

/**
 * Resolve the target then fetch it, allowing allowlisted hosts and rejecting
 * non-public destinations otherwise (stock `http` behavior).
 *
 * @param rawUrl - the requested URL.
 * @param matchers - compiled allowlist matchers.
 * @param maxBodyChars - decoded body char cap for allowlisted hosts.
 * @param signal - cancellation signal.
 */
async function fetchAllowlisted(
  rawUrl: string,
  matchers: readonly HostMatcher[],
  maxBodyChars: number,
  signal?: AbortSignal,
): Promise<WebFetchResult> {
  const url = parseHttpUrl(rawUrl);
  const host = url.hostname;
  const literalFamily = ipFamily(host);

  // IP literal (no DNS).
  if (literalFamily !== 0) {
    if (allowlistedFor(host, [normalizeIp(host)], matchers)) {
      return directFetch(url, maxBodyChars, signal);
    }
    if (isNonPublicAddress(host)) {
      throw new Error(
        `web-allowlist-fetch: "${host}" resolves to a non-public IP and is not on the allowlist`,
      );
    }
    return directFetch(url, maxBodyChars, signal);
  }

  // Hostname: resolve then apply allowlist / public guard.
  const addresses = await resolveAddresses(host);
  if (addresses.length === 0) {
    throw new Error(`web-allowlist-fetch: host "${host}" resolved to no addresses`);
  }
  if (allowlistedFor(host, addresses, matchers)) {
    return directFetch(url, maxBodyChars, signal);
  }
  const firstNonPublic = addresses.find(isNonPublicAddress);
  if (firstNonPublic !== undefined) {
    throw new Error(
      `web-allowlist-fetch: host "${host}" resolves to non-public IP ${firstNonPublic} and is not on the allowlist`,
    );
  }
  return directFetch(url, maxBodyChars, signal);
}

/** True when the hostname or any resolved address matches an allowlist matcher. */
function allowlistedFor(
  host: string,
  addresses: readonly string[],
  matchers: readonly HostMatcher[],
): boolean {
  return matchers.some((m) => m.matches(host, addresses));
}

/** Resolve a hostname to its (deduplicated) IPv4/IPv6 addresses. */
async function resolveAddresses(host: string): Promise<string[]> {
  const { lookup } = await import('node:dns/promises');
  try {
    const records = await lookup(host, { all: true, verbatim: true });
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of records) {
      const ip = normalizeIp(r.address);
      if (seen.has(ip)) continue;
      seen.add(ip);
      out.push(ip);
    }
    return out;
  } catch {
    return [];
  }
}

/** Fetch a URL with plain global `fetch`, decoding and bounding the body. */
async function directFetch(
  url: URL,
  maxBodyChars: number,
  signal?: AbortSignal,
): Promise<WebFetchResult> {
  const res = await fetch(url, {
    redirect: 'follow',
    signal,
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml,text/*;q=0.9,application/json;q=0.9',
    },
  });
  const text = await res.text();
  const kind: 'html' | 'text' = (res.headers.get('content-type') ?? '').includes('html')
    ? 'html'
    : 'text';
  const content = text.length > maxBodyChars ? text.slice(0, maxBodyChars) : text;
  const body: WebFetchBody = { kind, content };
  return {
    url: res.url || url.toString(),
    statusCode: res.status,
    body,
    truncated: text.length > maxBodyChars,
  };
}
//#endregion

/** Cordis plugin metadata. */
export const name = 'dsh-web-allowlist-fetch';
/** Cordis service requirements: `web` (fetch seam) is mandatory. */
export const inject = ['web'] as const;

/**
 * Cordis plugin entry: register the allowlist fetch provider.
 *
 * The provider reads its config through a thunk that unwraps the live
 * `Volatile<T>` references on every fetch, so a settings edit committed from
 * Settings → 插件配置 (auto-generated from this Config schema) applies on the
 * next fetch without re-registration or remounting.
 *
 * Routing `web.config.fetchProvider` to `allowlist` is handled by this
 * bundle's `cordis.patch.yml`.
 *
 * @param ctx - the Cordis context, providing `ctx.web` (the fetch seam).
 * @param config - validated plugin config carrying live `.volatile()` refs.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.web.registerFetchProvider(createAllowlistFetchProvider(() => resolveConfig(config)));
}