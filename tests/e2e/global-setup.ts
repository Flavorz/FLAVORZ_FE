import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const run = promisify(execFile);
const cwd = resolve(import.meta.dirname, '../..');
const URL = 'http://localhost:4321/';

/** Build the site and start Astro's managed preview daemon. */
export default async function globalSetup() {
  // Any leftover instance would refuse to start a new one on a different port.
  try {
    await run('pnpm', ['exec', 'astro', 'preview', 'stop'], { cwd, timeout: 30_000 });
  } catch {
    // Nothing running — the normal case in CI.
  }

  await run('pnpm', ['run', 'build:all'], { cwd, timeout: 300_000 });
  await run('pnpm', ['exec', 'astro', 'preview', '--port', '4321'], { cwd, timeout: 60_000 });

  // The daemon returns before it is necessarily accepting connections.
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(URL);
      if (res.ok) return;
    } catch {
      // Not up yet.
    }
    await sleep(300);
  }
  throw new Error(`preview server did not become available at ${URL}`);
}
