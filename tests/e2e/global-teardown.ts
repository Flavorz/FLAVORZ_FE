import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const run = promisify(execFile);

/** Stop the managed preview daemon so it does not outlive the test run. */
export default async function globalTeardown() {
  const cwd = resolve(import.meta.dirname, '../..');
  try {
    await run('pnpm', ['exec', 'astro', 'preview', 'stop'], { cwd, timeout: 30_000 });
  } catch {
    // Already stopped.
  }
}
