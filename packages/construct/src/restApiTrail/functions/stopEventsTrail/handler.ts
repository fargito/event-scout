import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { stopEventsTrailContract } from '@event-scout/construct-contracts';

import { buildDeleteEventBridgeRuleAndTarget } from 'common/utils/deleteEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

const deleteEventBridgeRuleAndTarget = buildDeleteEventBridgeRuleAndTarget({
  eventBridgeClient,
  eventBusName,
});

export const main = getHandler(stopEventsTrailContract)(async event => {
  const { trailId } = event.body;

  await deleteEventBridgeRuleAndTarget(trailId);

  // remove the trail item from DynamoDB
  await documentClient
    .delete({ TableName: tableName, Key: { PK: trailId, SK: `TRAIL` } })
    .promise();

  return { statusCode: HttpStatusCodes.OK, body: { trailId } };
});
