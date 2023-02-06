/**
 *
 * Wait for https://github.com/swarmion/swarmion/pull/402 to be merged then import it from Swarmion
 *
 * default esbuild config for our lambdas
 */
export const defaultEsbuildConfig = {
  packager: 'pnpm',
  bundle: true,
  minify: true,
  keepNames: true,
  sourcemap: true,
  exclude: ['aws-sdk'],
  target: 'node16',
  platform: 'node',
  /**
   * Sets the resolution order for esbuild.
   *
   * In order to enable tree-shaking of packages, we need specify `module` first (ESM)
   * Because it defaults to "main" first (CJS, not tree shakeable)
   * https://esbuild.github.io/api/#main-fields
   */
  mainFields: ['module', 'main'],
  concurrency: 5,
};
