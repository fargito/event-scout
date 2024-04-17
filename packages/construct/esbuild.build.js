import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: [
    'src/lambdas/startEventsTrail.ts',
    'src/lambdas/listEvents.ts',
    'src/lambdas/stopEventsTrail.ts',
    'src/lambdas/storeEvents.ts',
    'src/lambdas/trailGarbageCollector.ts',
    'src/lambdas/forwardEvent.ts',
    'src/lambdas/onStartTrail.ts',
    'src/lambdas/onWebSocketConnect.ts',
    'src/lambdas/onWebSocketDisconnect.ts',
  ],
  outdir: 'dist/',
  bundle: true,
  minify: true,
  keepNames: true,
  sourcemap: true,
  external: ['aws-sdk', '@aws-sdk/*'], // since we are on node20, we should get these out-of the box from the runtime
  target: 'node20',
  platform: 'node',
  /**
   * Sets the resolution order for esbuild.
   *
   * In order to enable tree-shaking of packages, we need specify `module` first (ESM)
   * Because it defaults to "main" first (CJS, not tree shakeable)
   * https://esbuild.github.io/api/#main-fields
   */
  mainFields: ['module', 'main'],
});
