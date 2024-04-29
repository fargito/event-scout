import {
  CloudFormationClient,
  ListExportsCommand,
} from '@aws-sdk/client-cloudformation';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { fromEnv, fromIni } from '@aws-sdk/credential-providers';

import { EventScoutClient } from '@event-scout/client';

import {
  eventBusExportName,
  httpApiEndpointExportName,
} from 'utils/exportNames';
import { defaultEnvironment, region, sharedParams } from 'utils/sharedConfig';

// we need to use an environment variable in order to set the right credentials
const serverlessEnv = process.env.SLS_ENV ?? defaultEnvironment;

if (!Object.keys(sharedParams).includes(serverlessEnv)) {
  throw Error(`Not a valid serverless env: ${serverlessEnv}`);
}

const profile =
  sharedParams[serverlessEnv as keyof typeof sharedParams].profile;

const credentials =
  profile !== '' ? fromIni({ profile: sharedParams.dev.profile }) : fromEnv();

const cloudformationClient = new CloudFormationClient({
  region,
  credentials,
});

// For now Cloudformation has no better way than to query all exports and filter client-side
const cfOutputs = await cloudformationClient.send(new ListExportsCommand({}));

const eventScoutEndpoint = cfOutputs.Exports?.find(
  o => o.Name === httpApiEndpointExportName,
)?.Value;

const eventBusName = cfOutputs.Exports?.find(
  o => o.Name === eventBusExportName,
)?.Value;

if (eventScoutEndpoint === undefined || eventBusName === undefined)
  throw new Error('unable to retrieve output value');

const eventScoutClient = new EventScoutClient({
  credentials,
  region,
  endpoint: eventScoutEndpoint,
});

const eventBridgeClient = new EventBridgeClient({ credentials, region });

globalThis.eventScoutClient = eventScoutClient;
globalThis.eventBridgeClient = eventBridgeClient;
globalThis.eventBusName = eventBusName;
