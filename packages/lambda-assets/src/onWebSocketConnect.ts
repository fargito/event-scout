import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

const tableName = getEnvVariable('TEST_TABLE_NAME');
const dynamodbClient = new DynamoDBClient();

export const main: APIGatewayProxyWebsocketHandlerV2 = async event => {
  const { connectionId: trailId } = event.requestContext;

  // timestamp must be in seconds
  // see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html
  const timeToLive = Date.now() / 1000 + 90 * 60; // 90 minutes

  // store an item in DynamoDB to represent the trail. This will enable automatic cleanup
  // if the user forget to call the stop route
  await dynamodbClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        PK: trailId,
        SK: `TRAIL`,
        _ttl: timeToLive,
        trailId,
      },
    }),
  );

  return { statusCode: 200, body: 'Connected' };
};
