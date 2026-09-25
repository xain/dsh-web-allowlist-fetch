# dsh-web-allowlist-fetch

IP/domain **allowlist** `web_fetch` provider for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

`web_fetch` in Harness refuses any host that resolves to a **non-public IP**
(the `http` provider's `isPublicIpAddress` / `unicast` guard). In proxy
environments that use **RFC 2544 fake-IP** (Clash / Surge / Mihomo TUN mode, the
`198.18.0.0/15` range), ordinary public domains resolve to fake, non-public IPs
and get blocked — so fetching an otherwise-fine site fails with
`URL hostname "…" resolves to a non-public IP address`.

This plugin registers a `web_fetch` provider (`id: allowlist`) that:

- **allowlists** the hosts / IPs / CIDRs you configure, and fetches them freely
  (bypassing the public-IP guard — a fake-IP address is fine once its domain or
  the fake IP range is allowlisted);
- keeps the **stock public-IP safety check** for every other host, so the
  default posture is unchanged.

The allowlist is editable from the web client's **Plugins** panel; see
[Configuration](#configuration).

## Install

Publish this package (or install from your git URL), then in your Harness home:

```sh
dsh plugin --profile web add dsh-web-allowlist-fetch
```

The bundle's `cordis.patch.yml` registers the provider and routes
`web.config.fetchProvider` → `allowlist`.

> **install-time note:** a patch row targets a Cordis row by id and replaces its
> **whole config**. The bundled patch therefore sets the full `web` config (both
> `fetchProvider` and `searchProvider`). Edit `searchProvider` in the patch to
> match your search setup, or the value set by another layer will be overwritten.

## Configuration

The allowlist is a `.volatile()` plugin Config field. DSH projects those fields
into a settings form keyed by this bundle's profile entry id
(`web-fetch-allowlist`), and this package's browser half registers the page that
edits it into the **Plugins** panel (the sidebar's `Plugins` entry → *Web fetch
allowlist*). A committed edit lands in the profile's patch layer and applies on
the next fetch without a restart.

The composed default lives in this bundle's `cordis.patch.yml`; override it in
your profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: web-fetch-allowlist
      name: dsh-web-allowlist-fetch
      config:
        allowlist:
          - weather.com            # this domain + any subdomain
          - 198.18.0.0/15          # Clash fake-IP range (any host resolving here)
          - 127.0.0.1              # a single IP literal
- id: web
  config:
    fetchProvider: allowlist
    searchProvider: ddg
```

`maxBodyChars` (default `200000`) is configurable the same way.

### Entry forms

| Form              | Matches                                            |
| ----------------- | -------------------------------------------------- |
| `example.com`     | `example.com` and every `*.example.com`            |
| `.example.com`    | `example.com` and every subdomain                  |
| `*.example.com`   | every subdomain                                    |
| `192.168.1.10`    | that exact IP literal                              |
| `198.18.0.0/15`   | any host/IP within that CIDR network               |
| `2001:db8::/32`   | any host/IP within that IPv6 CIDR network          |

## How it behaves

- **Allowlisted host/IP** → fetched directly via global `fetch` (follows
  redirects). Body decoded as text/html and capped at `maxBodyChars`.
- **Non-allowlisted host that resolves only to public IPs** → fetched directly.
- **Non-allowlisted host resolving to any non-public IP** → rejected with a
  descriptive error (unchanged from stock `http` behavior).

## Safety

This is an **escape hatch**, not a blanket disable. Only entries you list are
released from the public-IP guard. Do not allowlist `0.0.0.0/0`, `198.18.0.0/0`,
or `10.0.0.0/8` unless you fully understand the implication for a model that can
choose URLs — it would let the model reach your private network.

## Development

```sh
pnpm install
pnpm run check   # build (tsdown) + node --test tests
```

Build output: `lib/index.js` (ESM). Host peers resolve from the Harness profile
at runtime and stay external.