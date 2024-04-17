import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { EventBridgeEvent } from 'aws-lambda';

const webSocketEndpoint = getEnvVariable('WEBSOCKET_ENDPOINT');
const endpoint = webSocketEndpoint.replace('wss', 'https');

const apiGatewayClient = new ApiGatewayManagementApiClient({ endpoint });

export const main = async (
  event: EventBridgeEvent<string, unknown> & { trailId: string },
): Promise<void> => {
  const { trailId } = event;

  const data = new TextEncoder().encode(JSON.stringify(event));

  await apiGatewayClient.send(
    new PostToConnectionCommand({
      ConnectionId: trailId,
      Data: data,
    }),
  );
};
