import workerSource from 'maplibre-gl/dist/maplibre-gl-worker.mjs?raw';

// From file:// a worker script cannot be loaded by URL, and a blob module worker is refused for the
// opaque origin, so the worker is inlined as a data URL.
(globalThis as { __WTG_WORKER_URL__?: string }).__WTG_WORKER_URL__ =
  'data:text/javascript;charset=utf-8,' + encodeURIComponent(workerSource);

void import('./main');
