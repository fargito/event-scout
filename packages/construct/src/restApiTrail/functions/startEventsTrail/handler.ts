import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { getHandler } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { randomUUID } from 'crypto';

import { startEventsTrailContract } from '@event-scout/construct-contracts';

import { buildCreateEventBridgeRuleAndTarget } from 'common/utils/createEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const storeEventsLambdaArn = getEnvVariable('STORE_EVENTS_LAMBDA_ARN');
const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

const createEventBridgeRuleAndTarget = buildCreateEventBridgeRuleAndTarget({
  eventBridgeClient,
  eventBusName,
});

export const main = getHandler(startEventsTrailContract)(async event => {
  const { eventPattern } = event.body;

  const trailId = randomUUID();

  // timestamp must be in seconds
  // see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html
  const timeToLive = Date.now() / 1000 + 15 * 60; // 15 minutes

  // store an item in DynamoDB to represent the trail. This will enable automatic cleanup
  // if the user forget to call the stop route
  await documentClient
    .put({
      TableName: tableName,
      Item: { PK: trailId, SK: `TRAIL`, _ttl: timeToLive, trailId },
    })
    .promise();

  // create the rule and target
  await createEventBridgeRuleAndTarget({
    eventPattern,
    targetArn: storeEventsLambdaArn,
    trailId,
  });

  return { trailId };
});
