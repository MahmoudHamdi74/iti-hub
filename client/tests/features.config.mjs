import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: Object.fromEntries(Object.entries({
    '@': 'src', '@hooks': 'src/hooks', '@store': 'src/store', '@components': 'src/components', '@lib': 'src/lib',
  }).map(([key, value]) => [key, path.resolve(value)])) },
  test: { environment: 'happy-dom', include: ['tests/features.test.jsx'] },
});
