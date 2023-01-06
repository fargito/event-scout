import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { DynamoDBStreamEvent } from 'aws-lambda';

import { buildDeleteEventBridgeRuleAndTarget } from 'utils/deleteEventBridgeRuleAndTarget';

const eventBridgeClient = new EventBridgeClient({});
const eventBusName = getEnvVariable('EVENT_BUS_NAME');
const deleteEventBridgeRuleAndTarget = buildDeleteEventBridgeRuleAndTarget({
  eventBridgeClient,
  eventBusName,
});

export const main = async (event: DynamoDBStreamEvent): Promise<void> => {
  const trailId = event.Records[0]?.dynamodb?.OldImage?.trailId?.S;

  if (trailId === undefined) throw new Error('Unable to find trailId');

  await deleteEventBridgeRuleAndTarget(trailId);
};
