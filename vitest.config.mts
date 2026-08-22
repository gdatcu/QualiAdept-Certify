import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    exclude: ['tests/e2e/**', 'node_modules/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/app/actions/**/*.ts',
        'src/app/api/validate/**/*.ts',
        'src/app/api/certificate/**/*.ts',
        'src/app/api/trainer/**/*.ts',
        'src/app/api/user/**/*.ts',
        'src/components/CodeBlock.tsx',
        'src/components/Footer.tsx',
        'src/components/HeaderAuth.tsx',
        'src/lib/webhook.ts',
      ],
      exclude: ['src/types/**', 'src/**/*.d.ts'],
      thresholds: {
        lines: 70,
        functions: 60,
        branches: 50,
        statements: 70,
      },
    },
  },
});
