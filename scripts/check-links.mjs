import net from 'node:net';

net.setDefaultAutoSelectFamilyAttemptTimeout(5000);

import { readFile } from 'node:fs/promises';

const FILES = JSON.parse(await readFile('public/data/event-files.json', 'utf8'));
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const urls = new Map();
for (const f of FILES) {
  for (const e of JSON.parse(await readFile(`public/data/${f}`, 'utf8'))) {
    for (const [kind, url] of Object.entries(e.links ?? {})) urls.set(url, `${e.id} ${kind}`);
  }
}

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      if (res.ok || (method === 'GET' && [401, 403, 429].includes(res.status))) return String(res.status);
    } catch (e) {
      if (method === 'GET') return `error ${e.cause?.code ?? e.message}`;
    }
  }
  return 'failed';
}

let bad = 0;
for (const [url, what] of urls) {
  const status = await check(url);
  const ok = /^(2\d\d|401|403|429)$/.test(status);
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${status.padEnd(14)} ${what.padEnd(34)} ${url}`);
}
console.log(`${urls.size} links, ${bad} failed`);
process.exit(bad ? 1 : 0);
