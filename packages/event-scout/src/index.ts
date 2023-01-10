import { fromEnv, fromIni } from '@aws-sdk/credential-providers';
import { Command } from 'commander';

import { EventPattern } from '@event-scout/construct-contracts';

import { listenToWebSocket } from './listenToWebSocket';

const program = new Command()
  .option('-p, --aws-profile <aws-profile>', 'aws profile')
  .option('-r, --aws-region <aws-region>', 'aws region')
  .option('--endpoint <endpoint>', 'websocket endpoint')
  .option('--pattern <patter>', 'event pattern')
  .parse(process.argv);

const options = program.opts();

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const awsProfile: string | undefined = options.awsProfile;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const awsRegion: string | undefined = options.awsRegion;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const endpoint: string | undefined = options.endpoint;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pattern: string | undefined = options.pattern;

const credentials =
  awsProfile !== undefined ? fromIni({ profile: awsProfile }) : fromEnv();

const region = awsRegion ?? 'eu-west-1';

const webSocketEndpoint = endpoint ?? '';

// TODO add validation
const eventPattern =
  pattern !== undefined ? (JSON.parse(pattern) as EventPattern) : {};

void listenToWebSocket({
  webSocketEndpoint,
  credentials,
  region,
  eventPattern,
});
