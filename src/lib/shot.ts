import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Resolve a photograph for a card, at build time.
 *
 * Images are referenced by path but may not exist yet. Emitting a
 * `background-image` for a missing file gives a 404 per card, which clutters
 * the console and hides real errors — so an absent file emits nothing and the
 * design's panel colour shows through instead.
 *
 * Runs during the static build, so there is no runtime cost.
 */
export function shot(publicPath: string): string {
  const onDisk = join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
  return existsSync(onDisk) ? `--fz-shot:url('${publicPath}')` : '';
}
