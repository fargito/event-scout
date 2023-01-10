import { fromIni } from '@aws-sdk/credential-providers';

import { listenToWebSocket } from './listenToWebSocket';

const webSocketEndpoint = 'wss://xxxx.execute-api.eu-west-1.amazonaws.com/dev/';

const credentials = fromIni({ profile: 'xxxx' });
const region = 'eu-west-1';

const eventPattern = { source: ['toto'] };

void listenToWebSocket({
  webSocketEndpoint,
  credentials,
  region,
  eventPattern,
});
