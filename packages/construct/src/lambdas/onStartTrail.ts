import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import {
  StartWebsocketEventTrailBody,
  startWebsocketEventTrailBodySchema,
} from '@event-scout/construct-contracts';

import { buildCreateEventBridgeRuleAndTarget } from 'lambdas/utils/createEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const forwardEventLambdaArn = getEnvVariable('FORWARD_EVENT_LAMBDA_ARN');
const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

const createEventBridgeRuleAndTarget = buildCreateEventBridgeRuleAndTarget({
  eventBridgeClient,
  eventBusName,
});

export const main: APIGatewayProxyWebsocketHandlerV2 = async event => {
  const { connectionId: trailId } = event.requestContext;
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
        PK: trailId,
        SK: `TRAIL`,
      },
      UpdateExpression: 'SET eventPattern = :eventPattern',
      ExpressionAttributeValues: {
        ':eventPattern': eventPattern,
      },
    })
    .promise();

  // create the rule and target
  await createEventBridgeRuleAndTarget({
    eventPattern,
    targetArn: forwardEventLambdaArn,
    trailId: trailId,
  });

  return { statusCode: 200, body: 'Ok' };
};
