import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';

import { listEventsContract } from '@event-scout/construct-contracts';

import { buildListAllTrailEvents } from './utils/listAllTrailEvents';

const tableName = getEnvVariable('EVENT_SCOUT_TABLE_NAME');
const dynamodbClient = new DynamoDBClient();
const listAllTrailEvents = buildListAllTrailEvents(dynamodbClient, tableName);

export const main = getHandler(listEventsContract, {
  ajv: new Ajv(),
  validateInput: true,
  validateOutput: true,
})(async event => {
  const { trailId } = event.pathParameters;

  const events = await listAllTrailEvents(trailId);

  return { statusCode: HttpStatusCodes.OK, body: events };
});
