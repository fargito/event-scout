import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

export const main: APIGatewayProxyWebsocketHandlerV2 = async event => {
  await Promise.resolve();
  console.log(event);

  return { statusCode: 200, body: 'Connected' };
};
