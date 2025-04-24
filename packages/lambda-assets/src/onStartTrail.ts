import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

import {
  type StartWebsocketEventTrailBody,
  startWebsocketEventTrailBodySchema,
} from '@event-scout/construct-contracts';

import { version } from '../package.json';
import { buildCreateEventBridgeRuleAndTarget } from './utils/createEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const forwardEventLambdaArn = getEnvVariable('FORWARD_EVENT_LAMBDA_ARN');
const tableName = getEnvVariable('EVENT_SCOUT_TABLE_NAME');
const dynamodbClient = new DynamoDBClient();

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
  await dynamodbClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: trailId,
        SK: `TRAIL`,
      },
      UpdateExpression: 'SET eventPattern = :eventPattern',
      ExpressionAttributeValues: {
        ':eventPattern': eventPattern,
      },
    }),
  );

  // create the rule and target
  await createEventBridgeRuleAndTarget({
    eventPattern,
    targetArn: forwardEventLambdaArn,
    trailId: trailId,
  });

  return {
    statusCode: HttpStatusCodes.OK,
    headers: { 'x-event-scout-version': version },
    body: 'Ok',
  };
};
