import { setWorkerUrl } from 'maplibre-gl';
import workerSource from 'maplibre-gl/dist/maplibre-gl-worker.mjs?raw';

// From file:// a worker script cannot be loaded by URL, so the worker runs from an inline blob.
setWorkerUrl(URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })));

void import('./main');
