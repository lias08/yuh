import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 2000 },
  server: { host: true },
  worker: { format: 'es' },
  optimizeDeps: { include: ['three', 'three/examples/jsm/geometries/RoundedBoxGeometry.js', 'three/examples/jsm/utils/BufferGeometryUtils.js'] },
});
