import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { fromEnv, fromIni } from '@aws-sdk/credential-providers';

import { EventScoutClient } from '@event-scout/client';
import {
  defaultEnvironment,
  region,
  sharedParams,
} from '@event-scout/serverless-configuration';

import {
  eventBusExportName,
  restApiEndpointExportName,
} from 'utils/exportNames';
import { buildGetOutputValue } from 'utils/getOutputValue';

// we need to use an environment variable in order to set the right credentials
const serverlessEnv = process.env.SLS_ENV ?? defaultEnvironment;

if (!Object.keys(sharedParams).includes(serverlessEnv)) {
  throw Error(`Not a valid serverless env: ${serverlessEnv}`);
}

const profile =
  sharedParams[serverlessEnv as keyof typeof sharedParams].profile;

export const credentials =
  profile !== '' ? fromIni({ profile: sharedParams.dev.profile }) : fromEnv();

const eventScoutEndpoint = await buildGetOutputValue({ credentials, region })(
  restApiEndpointExportName,
);

const eventBusName = await buildGetOutputValue({ credentials, region })(
  eventBusExportName,
);

const eventScoutClient = new EventScoutClient({
  credentials,
  region,
  endpoint: eventScoutEndpoint,
});

const eventBridgeClient = new EventBridgeClient({ credentials, region });

globalThis.eventScoutClient = eventScoutClient;
globalThis.eventBridgeClient = eventBridgeClient;
globalThis.eventBusName = eventBusName;
