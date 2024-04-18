import { execSync } from 'child_process';
import esbuild from 'esbuild';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

const lambdas = [
  'startEventsTrail',
  'listEvents',
  'stopEventsTrail',
  'storeEvents',
  'trailGarbageCollector',
  'forwardEvent',
  'onStartTrail',
  'onWebSocketConnect',
  'onWebSocketDisconnect',
];

await esbuild.build({
  entryPoints: lambdas.map(name => `src/lambdas/${name}.ts`),
  outdir: '.esbuild',
  bundle: true,
  minify: true,
  entryNames: '[name]/handler',
  keepNames: true,
  sourcemap: true,
  external: ['@aws-sdk/*'], // since we are on node20, we should get these out-of the box from the runtime
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

for (const lambda of lambdas) {
  execSync(
    `cd .esbuild/${lambda} && zip -r ${lambda}.zip . && mv ${lambda}.zip ${join(__dirname, 'dist')} && cd ${__dirname}`,
  );
}
