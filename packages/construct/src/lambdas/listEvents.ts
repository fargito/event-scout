import {
  // this type import is necessary to infer the handler type
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type ApiGatewayHandler as _ApiGatewayHandler,
  getHandler,
  HttpStatusCodes,
} from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { listEventsContract } from '@event-scout/construct-contracts';

import { buildListAllTrailEvents } from 'lambdas/utils/listAllTrailEvents';

const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();
const listAllTrailEvents = buildListAllTrailEvents(documentClient, tableName);

export const main = getHandler(listEventsContract, {
  ajv: new Ajv(),
  validateInput: true,
  validateOutput: true,
})(async event => {
  const { trailId } = event.pathParameters;

  const events = await listAllTrailEvents(trailId);

  return { statusCode: HttpStatusCodes.OK, body: events };
});
