import workerSource from 'maplibre-gl/dist/maplibre-gl-worker.mjs?raw';

// From file:// a worker cannot be loaded by URL, and module workers from blob or data URLs are refused.
// The worker file is self-contained except for a trailing export, so it runs as a classic worker
// from a blob; the "#.cjs" suffix makes MapLibre treat the URL as a classic script.
const classicSource = workerSource.replace(/export\{[^}]*\};?/, '');
(globalThis as { __WTG_WORKER_URL__?: string }).__WTG_WORKER_URL__ =
  URL.createObjectURL(new Blob([classicSource], { type: 'text/javascript' })) + '#.cjs';

void import('./main');
