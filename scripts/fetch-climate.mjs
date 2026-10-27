import { mkdir, readFile, writeFile, access, stat } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

// Node's 250 ms default per-address connect timeout is too short for this API from some networks.
net.setDefaultAutoSelectFamilyAttemptTimeout(5000);

const CACHE = process.env.DATA_CACHE ?? '/home/app/data-cache';
const POWER_DIR = path.join(CACHE, 'power');
const OUT = 'public/data';
const YEARS = [2015, 2024];
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const RAIN_MM = { light: 100, moderate: 170, heavy: 300 };
const CONCURRENCY = 3;

const round1 = (v) => (v === null ? null : Math.round(v * 10) / 10);

function rainLevel(mm) {
  if (mm === null) return null;
  if (mm >= RAIN_MM.heavy) return 3;
  if (mm >= RAIN_MM.moderate) return 2;
  if (mm >= RAIN_MM.light) return 1;
  return 0;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function fetchPower(lon, lat) {
  const file = path.join(POWER_DIR, `v2_${lon.toFixed(2)}_${lat.toFixed(2)}_${YEARS[0]}-${YEARS[1]}.json`);
  if (await exists(file)) return JSON.parse(await readFile(file, 'utf8'));
  const url =
    'https://power.larc.nasa.gov/api/temporal/monthly/point' +
    `?parameters=T2M,T2M_RANGE,PRECTOTCORR&community=RE&longitude=${lon}&latitude=${lat}` +
    `&start=${YEARS[0]}&end=${YEARS[1]}&format=JSON`;
  let lastErr;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 20000 * (attempt + 1)));
        throw new Error('HTTP 429');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const slim = json.properties.parameter;
      await writeFile(file, JSON.stringify(slim));
      return slim;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw new Error(`POWER ${lon},${lat}: ${lastErr}`);
}

// Average the per-year monthly values (keys YYYYMM; month 13 is the annual value) into 12 months.
function monthlyMeans(series) {
  const sums = Array(12).fill(0);
  const counts = Array(12).fill(0);
  for (const [key, v] of Object.entries(series)) {
    const m = Number(key.slice(4));
    if (m < 1 || m > 12 || v === -999) continue;
    sums[m - 1] += v;
    counts[m - 1] += 1;
  }
  return sums.map((s, i) => (counts[i] ? s / counts[i] : null));
}

function mean(values) {
  const v = values.filter((x) => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

async function pool(items, worker) {
  let next = 0;
  let done = 0;
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i]);
      done++;
      if (done % 50 === 0) console.log(`  ${done}/${items.length}`);
    }
  });
  await Promise.all(runners);
}

async function main() {
  await mkdir(POWER_DIR, { recursive: true });
  const areas = JSON.parse(await readFile(path.join(OUT, 'areas.geojson'), 'utf8')).features.map((f) => f.properties);
  const costs = JSON.parse(await readFile('data-src/costs.json', 'utf8'));
  const overrides = JSON.parse(await readFile('data-src/overrides.json', 'utf8'));

  const leaves = areas.filter((a) => a.level !== 'country');
  console.log(`fetching ${leaves.length} points`);
  const raw = new Map();
  await pool(leaves, async (a) => {
    const [lon, lat] = a.point;
    raw.set(a.id, await fetchPower(lon, lat));
  });

  const climate = {};
  const costFor = (cc) => Array.from({ length: 12 }, (_, i) => {
    const base = costs.base[cc] ?? 2;
    const delta = costs.delta[cc]?.[String(i + 1)] ?? 0;
    return Math.min(3, Math.max(1, base + delta));
  });

  const build = (a, hi, lo, rainMm) => {
    const c = { hi: hi.map(round1), lo: lo.map(round1), rain: rainMm.map((v) => (v === null ? null : Math.round(v))) };
    c.rainLevel = c.rain.map(rainLevel);
    c.cost = costFor(a.country);
    const country = overrides.country?.[a.country] ?? {};
    const area = overrides.area?.[`${a.country}:${a.name}`] ?? {};
    const merged = { ...country, ...area };
    if (merged.heating) c.heating = merged.heating;
    if (merged.cooling) c.cooling = merged.cooling;
    for (const [m, d] of Object.entries(merged.tempOffset ?? {})) {
      const i = Number(m) - 1;
      if (c.hi[i] !== null) c.hi[i] = round1(c.hi[i] + d);
      if (c.lo[i] !== null) c.lo[i] = round1(c.lo[i] + d);
    }
    for (const [m, l] of Object.entries(merged.rainLevel ?? {})) c.rainLevel[Number(m) - 1] = l;
    if (merged.comfort) {
      c.comfort = Array(12).fill(null);
      for (const [m, v] of Object.entries(merged.comfort)) c.comfort[Number(m) - 1] = v;
    }
    return c;
  };

  for (const a of leaves) {
    const s = raw.get(a.id);
    // T2M_MAX and T2M_MIN are the month's extremes, so typical high and low come from mean +/- half the daily range.
    const mid = monthlyMeans(s.T2M);
    const half = monthlyMeans(s.T2M_RANGE).map((v) => (v === null ? null : v / 2));
    const hi = mid.map((v, i) => (v === null || half[i] === null ? null : v + half[i]));
    const lo = mid.map((v, i) => (v === null || half[i] === null ? null : v - half[i]));
    const rain = monthlyMeans(s.PRECTOTCORR).map((v, i) => (v === null ? null : v * DAYS[i]));
    climate[a.id] = build(a, hi, lo, rain);
  }

  // Country areas hold the mean of their provinces and islands are left out of the mean.
  const byCountry = new Map();
  for (const a of leaves.filter((x) => x.level === 'province')) {
    if (!byCountry.has(a.country)) byCountry.set(a.country, []);
    byCountry.get(a.country).push(climate[a.id]);
  }
  for (const a of areas.filter((x) => x.level === 'country')) {
    const kids = byCountry.get(a.country) ?? [];
    const col = (key, i) => mean(kids.map((k) => k[key][i]));
    const hi = Array.from({ length: 12 }, (_, i) => col('hi', i));
    const lo = Array.from({ length: 12 }, (_, i) => col('lo', i));
    const rain = Array.from({ length: 12 }, (_, i) => col('rain', i));
    climate[a.id] = build(a, hi, lo, rain);
  }

  await writeFile(path.join(OUT, 'climate.json'), JSON.stringify(climate) + '\n');
  const { size } = await stat(path.join(OUT, 'climate.json'));
  console.log(`climate.json: ${Object.keys(climate).length} areas, ${(size / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
