// Web Worker: sculpts character meshes off the main thread.
import { generate, transferables } from './charGen.js';
self.onmessage = (e) => {
  const { id, look, quality } = e.data;
  try {
    const g = generate(look, quality);
    self.postMessage({ id, g }, transferables(g));
  } catch (err) {
    self.postMessage({ id, g: null, error: String(err) });
  }
};
