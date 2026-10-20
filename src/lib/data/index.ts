/**
 * The single place screens get content from.
 *
 *   import { content } from '../lib/data';
 *   const home = await content.home();
 *
 * Which source backs it is decided by PUBLIC_CONTENT_SOURCE:
 *   'mock' (default) — JSON in src/content/
 *   'api'            — the real backend, see ./api.ts
 *
 * Switching is an env change, not a code change.
 */
import { mockSource } from './mock';
import { apiSource } from './api';
import type { ContentSource } from './types';

const mode = import.meta.env.PUBLIC_CONTENT_SOURCE ?? 'mock';

export const content: ContentSource = mode === 'api' ? apiSource : mockSource;
export const contentMode = mode;
export * from './types';
