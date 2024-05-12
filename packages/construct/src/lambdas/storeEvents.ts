// this rule is useless in this file, since we bundle it before shipping
/* eslint-disable import/no-extraneous-dependencies */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import type { EventBridgeEvent } from 'aws-lambda';

const tableName = getEnvVariable('TEST_TABLE_NAME');
const dynamodbClient = new DynamoDBClient();

export const main = async (
  event: EventBridgeEvent<string, unknown> & { trailId: string },
): Promise<void> => {
  // timestamp must be in seconds
  // see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html
  const timeToLive = Date.now() / 1000 + 15 * 60; // 15 minutes

  await dynamodbClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        event,
        PK: event.trailId,
        SK: `EVENT#${event.time}#${event.id}`,
        _ttl: timeToLive,
      },
    }),
  );
};
