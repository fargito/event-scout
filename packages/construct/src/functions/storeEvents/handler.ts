import { getEnvVariable } from '@swarmion/serverless-helpers';
import { EventBridgeEvent } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { randomUUID } from 'crypto';

const tableName = getEnvVariable('TEST_TABLE_NAME');
const documentClient = new DocumentClient();

export const main = async (
  event: EventBridgeEvent<string, unknown> & { trailId: string },
): Promise<void> => {
  // timestamp must be in seconds
  // see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html
  const timeToLive = Date.now() / 1000 + 15 * 60; // 15 minutes

  // we don't want to overwrite other items so we need to add something to separate them
  const uuid = randomUUID();

  await documentClient
    .put({
      TableName: tableName,
      Item: {
        event,
        PK: event.trailId,
        SK: `EVENT#${event.time}#${event.source}#${event['detail-type']}#${uuid}`,
        _ttl: timeToLive,
      },
    })
    .promise();
};
