import { mkdir, readFile, writeFile, appendFile, access, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);

const CACHE = process.env.DATA_CACHE ?? '/home/app/data-cache';
const WORK = path.join(CACHE, 'natural-earth');
const OUT = 'public/data';
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson';
const MAPSHAPER = 'node_modules/mapshaper/bin/mapshaper';

const COUNTRIES = new Set([
  'BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'TL', 'VN',
  'CN', 'JP', 'KP', 'KR', 'MN', 'TW', 'HK', 'MO',
]);

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(file) {
  const dest = path.join(WORK, file);
  if (await exists(dest)) return dest;
  console.log(`downloading ${file}`);
  const res = await fetch(`${NE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

function mapshaper(args) {
  return run(process.execPath, [MAPSHAPER, ...args], { maxBuffer: 1 << 26 });
}

function circle([lon, lat], radiusKm, n = 48) {
  const dLat = radiusKm / 110.574;
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const ring = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    ring.push([+(lon + dLon * Math.cos(a)).toFixed(3), +(lat + dLat * Math.sin(a)).toFixed(3)]);
  }
  ring.push(ring[0]);
  return { type: 'Polygon', coordinates: [ring] };
}

async function main() {
  await mkdir(WORK, { recursive: true });
  await mkdir(OUT, { recursive: true });

  const admin1Path = await download('ne_10m_admin_1_states_provinces.geojson');
  const landPath = await download('ne_110m_admin_0_countries.geojson');

  const admin1 = JSON.parse(await readFile(admin1Path, 'utf8'));
  const countryNames = {};
  const features = [];
  for (const f of admin1.features) {
    const p = f.properties;
    if (!COUNTRIES.has(p.iso_a2)) continue;
    countryNames[p.iso_a2] = p.admin;
    features.push({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        id: p.adm1_code,
        name: (p.name_en ?? p.name).replace(/ Prefecture$/, ''),
        level: 'province',
        country: p.iso_a2,
        lon: p.longitude,
        lat: p.latitude,
      },
    });
  }
  console.log(`${features.length} provinces in ${Object.keys(countryNames).length} countries`);

  const inPath = path.join(WORK, 'provinces-in.geojson');
  const simplePath = path.join(WORK, 'provinces-simple.geojson');
  const countriesPath = path.join(WORK, 'countries-simple.geojson');
  await writeFile(inPath, JSON.stringify({ type: 'FeatureCollection', features }));

  await mapshaper([inPath, '-simplify', '6%', 'visvalingam', 'keep-shapes', '-o', simplePath, 'format=geojson', 'precision=0.01']);
  await mapshaper([simplePath, '-dissolve', 'country', '-o', countriesPath, 'format=geojson', 'precision=0.01']);

  const provinces = JSON.parse(await readFile(simplePath, 'utf8')).features.map((f) => {
    const { lon, lat, ...rest } = f.properties;
    return { ...f, properties: { ...rest, point: [lon, lat] } };
  });
  const countries = JSON.parse(await readFile(countriesPath, 'utf8')).features.map((f) => ({
    ...f,
    properties: {
      id: `country-${f.properties.country}`,
      name: countryNames[f.properties.country],
      level: 'country',
      country: f.properties.country,
      point: [0, 0],
    },
  }));

  const islandSrc = JSON.parse(await readFile('data-src/islands.json', 'utf8'));
  const islands = islandSrc.map((i) => ({
    type: 'Feature',
    geometry: circle([i.lon, i.lat], i.radiusKm),
    properties: {
      id: `island-${i.slug}`,
      name: i.name,
      level: 'island',
      country: i.country,
      point: [i.lon, i.lat],
    },
  }));

  const citySrc = JSON.parse(await readFile('data-src/cities.json', 'utf8'));
  const cities = citySrc.map((c) => ({
    type: 'Feature',
    geometry: circle([c.lon, c.lat], c.radiusKm),
    properties: {
      id: `city-${c.iata.split('/')[0].toLowerCase()}`,
      name: c.name,
      level: 'city',
      country: c.country,
      iata: c.iata,
      point: [c.lon, c.lat],
    },
  }));

  const areas = { type: 'FeatureCollection', features: [...countries, ...provinces, ...islands, ...cities] };
  await writeFile(path.join(OUT, 'areas.geojson'), JSON.stringify(areas) + '\n');

  const landOut = path.join(OUT, 'land.geojson');
  await mapshaper([
    landPath, '-clip', 'bbox=20,-45,180,80', '-filter-fields', 'NAME', '-simplify', '40%', 'visvalingam', 'keep-shapes',
    '-o', landOut, 'format=geojson', 'precision=0.02',
  ]);

  await appendFile(landOut, '\n');

  for (const f of ['areas.geojson', 'land.geojson']) {
    const { size } = await stat(path.join(OUT, f));
    console.log(`${f}: ${(size / 1024).toFixed(0)} KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
