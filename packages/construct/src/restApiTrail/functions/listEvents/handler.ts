import { getHandler } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { listEventsContract } from '@event-scout/construct-contracts';

import { buildListAllTrailEvents } from 'utils/listAllTrailEvents';

const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();
const listAllTrailEvents = buildListAllTrailEvents(documentClient, tableName);

export const main = getHandler(listEventsContract)(async event => {
  const { trailId } = event.pathParameters;

  const events = await listAllTrailEvents(trailId);

  return events;
});
