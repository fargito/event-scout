import { getEnvVariable } from '@swarmion/serverless-helpers';
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

export const main: APIGatewayProxyWebsocketHandlerV2 = async event => {
  const { connectionId } = event.requestContext;

  // timestamp must be in seconds
  // see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html
  const timeToLive = Date.now() / 1000 + 90 * 60; // 90 minutes

  // store an item in DynamoDB to represent the trail. This will enable automatic cleanup
  // if the user forget to call the stop route
  await documentClient
    .put({
      TableName: tableName,
      Item: {
        PK: connectionId,
        SK: `CONNECTION`,
        _ttl: timeToLive,
        connectionId,
      },
    })
    .promise();

  return { statusCode: 200, body: 'Connected' };
};
