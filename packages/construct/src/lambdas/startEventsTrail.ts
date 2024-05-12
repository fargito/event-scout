// this rule is useless in this file, since we bundle it before shipping
/* eslint-disable import/no-extraneous-dependencies */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';
import { randomUUID } from 'crypto';

import { startEventsTrailContract } from '@event-scout/construct-contracts';

import { buildCreateEventBridgeRuleAndTarget } from 'lambdas/utils/createEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const storeEventsLambdaArn = getEnvVariable('STORE_EVENTS_LAMBDA_ARN');
const tableName = getEnvVariable('TEST_TABLE_NAME');
const dynamodbClient = new DynamoDBClient();

const createEventBridgeRuleAndTarget = buildCreateEventBridgeRuleAndTarget({
  eventBridgeClient,
  eventBusName,
});

export const main = getHandler(startEventsTrailContract, {
  ajv: new Ajv(),
  validateInput: true,
  validateOutput: true,
})(async event => {
  const { eventPattern } = event.body;

  const trailId = randomUUID();

  // timestamp must be in seconds
  // see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html
  const timeToLive = Date.now() / 1000 + 15 * 60; // 15 minutes

  // store an item in DynamoDB to represent the trail. This will enable automatic cleanup
  // if the user forget to call the stop route
  await dynamodbClient.send(
    new PutCommand({
      TableName: tableName,
      Item: { PK: trailId, SK: `TRAIL`, _ttl: timeToLive, trailId },
    }),
  );

  // create the rule and target
  await createEventBridgeRuleAndTarget({
    eventPattern,
    targetArn: storeEventsLambdaArn,
    trailId,
  });

  return { statusCode: HttpStatusCodes.OK, body: { trailId } };
});
