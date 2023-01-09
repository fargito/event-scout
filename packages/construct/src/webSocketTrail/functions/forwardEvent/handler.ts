import { EventBridgeEvent } from 'aws-lambda';

export const main = async (
  event: EventBridgeEvent<string, unknown> & { trailId: string },
): Promise<void> => {
  await Promise.resolve();
  console.log(event);
};
