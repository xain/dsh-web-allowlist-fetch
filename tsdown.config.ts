import { defineConfig } from 'tsdown'

/** Peer APIs resolved from the Harness profile tree at runtime. */
const HOST_EXTERNALS = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-web',
  '@deepseek-ai/schemastery',
] as const

const ID = 'dsh-web-allowlist-fetch'

/**
 * Host-only bundle. The plugin contributes no browser half: its editable
 * `.volatile()` Config fields are projected into the Settings → 插件配置
 * surface automatically by the Harness settings shell, so no client bundle is
 * needed.
 */
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
])
