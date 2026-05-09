// Brand registry validator.
//
// For every BRAND_REGISTRY entry:
//   - hasCdnLogo: true   → assert simpleicons.org actually serves the slug
//   - hasCdnLogo: false  → assert simpleicons.org does NOT serve the slug
//                          (catches inverse mistake — entry marked unavailable
//                          but a real logo exists)
//
// The point: catch the "btc → bitcoin" class of bug at build time, not in
// production rendering. Run via `npm run validate:brands`.

import { BRAND_REGISTRY } from '../src/brand-registry';

const JSDELIVR = (slug: string) =>
  `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;

type Result =
  | { ticker: string; status: 'ok'; }
  | { ticker: string; status: 'missing'; slug: string; }
  | { ticker: string; status: 'unexpectedly-present'; slug: string; };

async function exists(slug: string): Promise<boolean> {
  try {
    const r = await fetch(JSDELIVR(slug), { method: 'HEAD' });
    return r.status === 200;
  } catch {
    return false;
  }
}

async function check(ticker: string, entry: typeof BRAND_REGISTRY[string]): Promise<Result> {
  const ok = await exists(entry.logoSlug);
  if (entry.hasCdnLogo && !ok) {
    return { ticker, status: 'missing', slug: entry.logoSlug };
  }
  if (!entry.hasCdnLogo && ok) {
    return { ticker, status: 'unexpectedly-present', slug: entry.logoSlug };
  }
  return { ticker, status: 'ok' };
}

async function main() {
  const entries = Object.entries(BRAND_REGISTRY);
  process.stdout.write(`Validating ${entries.length} brand entries against simpleicons CDN…\n`);
  const results = await Promise.all(entries.map(([t, e]) => check(t, e)));

  const missing  = results.filter((r): r is Extract<Result, { status: 'missing' }> => r.status === 'missing');
  const surprise = results.filter((r): r is Extract<Result, { status: 'unexpectedly-present' }> => r.status === 'unexpectedly-present');
  const okCount  = results.filter(r => r.status === 'ok').length;

  process.stdout.write(`\n✅ ${okCount}/${entries.length} entries OK\n`);

  if (missing.length) {
    process.stdout.write(`\n❌ ${missing.length} entries marked hasCdnLogo:true but slug 404s on simpleicons:\n`);
    for (const r of missing) {
      process.stdout.write(`   ${r.ticker.padEnd(6)} logoSlug: "${r.slug}"\n`);
    }
  }

  if (surprise.length) {
    process.stdout.write(`\n⚠️  ${surprise.length} entries marked hasCdnLogo:false but slug DOES exist (flip to true?):\n`);
    for (const r of surprise) {
      process.stdout.write(`   ${r.ticker.padEnd(6)} logoSlug: "${r.slug}"\n`);
    }
  }

  if (missing.length || surprise.length) {
    process.exit(1);
  }
}

main();
