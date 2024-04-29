import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

import { buildDeleteEventBridgeRuleAndTarget } from 'lambdas/utils/deleteEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const tableName = getEnvVariable('TEST_TABLE_NAME');
const dynamodbClient = new DynamoDBClient();

const deleteEventBridgeRuleAndTarget = buildDeleteEventBridgeRuleAndTarget({
  eventBridgeClient,
  eventBusName,
});

export const main: APIGatewayProxyWebsocketHandlerV2 = async event => {
  const { connectionId: trailId } = event.requestContext;

  await deleteEventBridgeRuleAndTarget(trailId);

  // remove the trail item from DynamoDB
  await dynamodbClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { PK: trailId, SK: `TRAIL` },
    }),
  );

  return { statusCode: 200, body: 'Disconnected' };
};
