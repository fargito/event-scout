import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';

import { stopEventsTrailContract } from '@event-scout/construct-contracts';

import { buildDeleteEventBridgeRuleAndTarget } from './utils/deleteEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const tableName = getEnvVariable('TEST_TABLE_NAME');
const dynamodbClient = new DynamoDBClient();

const deleteEventBridgeRuleAndTarget = buildDeleteEventBridgeRuleAndTarget({
  eventBridgeClient,
  eventBusName,
});

export const main = getHandler(stopEventsTrailContract, {
  ajv: new Ajv(),
  validateInput: true,
  validateOutput: true,
})(async event => {
  const { trailId } = event.body;

  await deleteEventBridgeRuleAndTarget(trailId);

  // remove the trail item from DynamoDB
  await dynamodbClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { PK: trailId, SK: `TRAIL` },
    }),
  );

  return { statusCode: HttpStatusCodes.OK, body: { trailId } };
});
