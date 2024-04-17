import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { buildDeleteEventBridgeRuleAndTarget } from 'lambdas/utils/deleteEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

const deleteEventBridgeRuleAndTarget = buildDeleteEventBridgeRuleAndTarget({
  eventBridgeClient,
  eventBusName,
});

export const main: APIGatewayProxyWebsocketHandlerV2 = async event => {
  const { connectionId: trailId } = event.requestContext;

  await deleteEventBridgeRuleAndTarget(trailId);

  // remove the trail item from DynamoDB
  await documentClient
    .delete({
      TableName: tableName,
      Key: { PK: trailId, SK: `TRAIL` },
    })
    .promise();

  return { statusCode: 200, body: 'Disconnected' };
};
