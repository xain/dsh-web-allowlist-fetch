import { defineConfig } from 'tsdown'

/** Peer APIs resolved from the Harness profile tree at runtime. */
const HOST_EXTERNALS = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-web',
  '@deepseek-ai/schemastery',
] as const

const ID = 'dsh-web-allowlist-fetch'

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