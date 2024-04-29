import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { EventBridgeEvent } from 'aws-lambda';

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
