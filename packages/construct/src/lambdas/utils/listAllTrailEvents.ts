// this rule is useless in this file, since we bundle it before shipping
/* eslint-disable import/no-extraneous-dependencies */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

type ListAllTrailEvents = (trailId: string) => Promise<unknown[]>;

export const buildListAllTrailEvents =
  (dynamodbClient: DynamoDBClient, tableName: string): ListAllTrailEvents =>
  async trailId => {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :PK and begins_with(SK, :SK)',
      ExpressionAttributeValues: {
        ':PK': trailId,
        ':SK': 'EVENT#',
      },
    });

    const { Items: events } = (await dynamodbClient.send(
      command,
    )) as unknown as {
      Items: { event: unknown; SK: string; PK: string }[];
    };

    return events.map(({ event }) => event);
  };
