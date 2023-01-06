import { getEnvVariable } from '@swarmion/serverless-helpers';
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

export const main: APIGatewayProxyWebsocketHandlerV2 = async event => {
  const { connectionId } = event.requestContext;

  // remove the trail item from DynamoDB
  await documentClient
    .delete({
      TableName: tableName,
      Key: { PK: connectionId, SK: `CONNECTION` },
    })
    .promise();

  return { statusCode: 200, body: 'Disconnected' };
};
