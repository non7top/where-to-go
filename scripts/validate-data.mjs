import { readFile } from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';

const ajv = new Ajv({ allErrors: true, strict: false });
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
let failed = false;

function check(name, schema, data) {
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    failed = true;
    console.error(`${name}: schema errors`);
    for (const e of validate.errors.slice(0, 10)) console.error(`  ${e.instancePath} ${e.message}`);
  } else {
    console.log(`${name}: ok`);
  }
}

function assert(cond, msg) {
  if (!cond) {
    failed = true;
    console.error(msg);
  }
}

const areas = await json('public/data/areas.geojson');
const climate = await json('public/data/climate.json');
const eventFiles = await json('public/data/event-files.json');

check('areas.geojson', await json('specs/001-static-map-prototype/contracts/areas.schema.json'), areas);
const climateSchema = await json('specs/001-static-map-prototype/contracts/climate.schema.json');
check('climate.json', climateSchema, climate);
const eventsSchema = await json('specs/001-static-map-prototype/contracts/events.schema.json');
const allEvents = [];
for (const f of eventFiles) {
  const list = await json(`public/data/${f}`);
  check(f, eventsSchema, list);
  allEvents.push(...list);
}

const areaIds = new Set(areas.features.map((f) => f.properties.id));
assert(areaIds.size === areas.features.length, 'duplicate area ids');
for (const id of areaIds) assert(id in climate, `no climate for area ${id}`);
for (const id of Object.keys(climate)) assert(areaIds.has(id), `climate for unknown area ${id}`);
for (const e of allEvents) {
  if (e.areaId) assert(areaIds.has(e.areaId), `event ${e.id}: unknown areaId ${e.areaId}`);
  for (const f of e.fronts ?? []) {
    for (const o of f.overrides ?? []) assert(areaIds.has(o.areaId), `event ${e.id}: front override for unknown area ${o.areaId}`);
  }
}
const ids = allEvents.map((e) => e.id);
assert(new Set(ids).size === ids.length, `duplicate event ids: ${ids.filter((x, i) => ids.indexOf(x) !== i).join(', ')}`);
console.log(`${allEvents.length} events in ${eventFiles.length} files`);

if (failed) process.exit(1);
