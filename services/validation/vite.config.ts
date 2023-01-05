/// <reference types="vitest" />

import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

const plugins = [tsconfigPaths()];

export default defineConfig({
  plugins,
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, 'cdk.out/**', 'integrationTests/*'],
  },
});
