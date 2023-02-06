import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    startEventsTrail: 'src/restApiTrail/functions/startEventsTrail/handler.ts',
    listEvents: 'src/restApiTrail/functions/listEvents/handler.ts',
    stopEventsTrail: 'src/restApiTrail/functions/stopEventsTrail/handler.ts',
    storeEvents: 'src/restApiTrail/functions/storeEvents/handler.ts',
    trailGarbageCollector:
      'src/restApiTrail/functions/trailGarbageCollector/handler.ts',
    forwardEvent: 'src/webSocketTrail/functions/forwardEvent/handler.ts',
    onStartTrail: 'src/webSocketTrail/functions/onStartTrail/handler.ts',
    onWebSocketConnect:
      'src/webSocketTrail/functions/onWebSocketConnect/handler.ts',
    onWebSocketDisconnect:
      'src/webSocketTrail/functions/onWebSocketDisconnect/handler.ts',
  },
  clean: true,
  silent: true,
  format: ['cjs', 'esm'],
  outDir: 'dist',
});
