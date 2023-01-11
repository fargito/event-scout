import { Command } from 'commander';

import { buildArguments } from './buildArguments';
import { listenToWebSocket } from './listenToWebSocket';

const program = new Command()
  .option('-p, --aws-profile <aws-profile>', 'aws profile')
  .option('-r, --aws-region <aws-region>', 'aws region')
  .option('--endpoint <endpoint>', 'websocket endpoint')
  .option('--pattern <patter>', 'event pattern')
  .parse(process.argv);

const options = program.opts();

const { webSocketEndpoint, credentials, region, eventPattern } =
  buildArguments(options);

void listenToWebSocket({
  webSocketEndpoint,
  credentials,
  region,
  eventPattern,
});
