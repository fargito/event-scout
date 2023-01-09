import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import {
  StartWebsocketEventTrailBody,
  startWebsocketEventTrailBodySchema,
} from '@event-scout/construct-contracts';

const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

export const main: APIGatewayProxyWebsocketHandlerV2 = async event => {
  const { connectionId } = event.requestContext;
  const { body } = event;

  if (body === undefined) {
    throw new Error('No body found');
  }

  const websocketBody: unknown = JSON.parse(body);

  const ajv = new Ajv();
  const validate = ajv.compile<StartWebsocketEventTrailBody>(
    startWebsocketEventTrailBodySchema,
  );

  if (!validate(websocketBody)) {
    console.error(validate.errors);
    throw new Error('Payload does not match type StartWebsocketEventTrailBody');
  }

  const { eventPattern } = websocketBody;

  // store an item in DynamoDB to represent the trail. This will enable automatic cleanup
  // if the user forget to call the stop route
  await documentClient
    .update({
      TableName: tableName,
      Key: {
        PK: connectionId,
        SK: `CONNECTION`,
      },
      UpdateExpression: 'SET eventPattern = :eventPattern',
      ExpressionAttributeValues: {
        ':eventPattern': eventPattern,
      },
    })
    .promise();

  return { statusCode: 200, body: 'Ok' };
};
