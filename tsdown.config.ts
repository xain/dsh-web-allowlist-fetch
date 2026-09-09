import { defineConfig } from 'tsdown'

/** Peer APIs resolved from the Harness profile tree at runtime. */
const HOST_EXTERNALS = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-web',
  '@deepseek-ai/schemastery',
] as const

/**
 * Client modules the dsh loader can resolve and so must stay external
 * (kept as `require(...)` in the lazy-CJS factory bundle). Anything not here
 * is inlined by the client build.
 */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-settings',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-ui-renderer/client',
  '@deepseek-ai/dsh-api-remotes',
  '@deepseek-ai/dsh-api-remotes/client',
  '@deepseek-ai/dsh-client-locale/client',
] as const

const ID = 'dsh-web-allowlist-fetch'

/**
 * The banner opens the lazy-CJS factory handoff. The dsh client bootstrap only
 * registers the factory via `window.__ModuleLoader__.load({ id, factory })` and
 * runs its body's side effects on first materialize, resolving externals
 * through the injected `require`.
 */
const CLIENT_BANNER = `window.__ModuleLoader__.load({ id: "${ID}", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
`
const CLIENT_FOOTER = `return module.exports; } });`

export default defineConfig([
  {
    name: ID,
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2022',
    dts: false,
    clean: false,
    fixedExtension: true,
    deps: {
      neverBundle: [...HOST_EXTERNALS],
    },
  },
  {
    name: `${ID}-client`,
    entry: ['src/client.ts'],
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    target: 'es2022',
    dts: false,
    clean: false,
    // Force `.js` (not `.cjs`): the dsh client loader looks up the browser
    // bundle via exports["./client"], which points at `lib/client.js`.
    outExtension: () => ({ js: '.js' }),
    banner: CLIENT_BANNER,
    footer: CLIENT_FOOTER,
    deps: {
      neverBundle: [...CLIENT_EXTERNALS],
    },
  },
])