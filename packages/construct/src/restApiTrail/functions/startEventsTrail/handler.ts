import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
} from '@aws-sdk/client-eventbridge';
import { getHandler } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { randomUUID } from 'crypto';

import { startEventsTrailContract } from '@event-scout/construct-contracts';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const storeEventsLambdaArn = getEnvVariable('STORE_EVENTS_LAMBDA_ARN');
const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

export const main = getHandler(startEventsTrailContract)(async event => {
  const { eventPattern } = event.body;

  const trailId = randomUUID();
  const ruleName = `test-rule-${trailId}`;
  const targetName = `test-target-${trailId}`;

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

  // put a new rule
  await eventBridgeClient.send(
    new PutRuleCommand({
      EventBusName: eventBusName,
      Name: ruleName,
      EventPattern: JSON.stringify(eventPattern),
    }),
  );

  // create a new target
  await eventBridgeClient.send(
    new PutTargetsCommand({
      EventBusName: eventBusName,
      Rule: ruleName,
      Targets: [
        {
          Id: targetName,
          Arn: storeEventsLambdaArn,
          // https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-transform-target-input.html
          InputTransformer: {
            InputTemplate: `
              {
                "id": <id>,
                "version": <version>,
                "account": <account>,
                "time": <time>,
                "region": <region>,
                "resources": <resources>,
                "source": <source>,
                "detail-type": <detail-type>,
                "detail": <detail>,
                "trailId": "${trailId}"
              }
            `,
            InputPathsMap: {
              id: '$.id',
              version: '$.version',
              account: '$.account',
              time: '$.time',
              region: '$.region',
              resources: '$.resources',
              source: '$.source',
              'detail-type': '$.detail-type',
              detail: '$.detail',
            },
          },
        },
      ],
    }),
  );

  return { trailId };
});
