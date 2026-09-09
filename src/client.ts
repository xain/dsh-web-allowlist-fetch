/**
 * Client bundle entry — emitted as `lib/client.js`.
 *
 * Re-exports the browser-half implementation so the entry's basename (`client`)
 * controls the output filename, which the dsh client loader looks up via
 * `exports["./client"]`.
 */

export type {
  AllowlistCardProps,
  AllowlistCardFace,
  AllowlistCardState,
  AllowlistSettings,
  CardActions,
  CardFieldSpec,
  CardFieldState,
  CardShell,
  SettingsPluginItemOwnerProps,
} from './client/index.js'

export { inject, apply } from './client/index.js'