import { DocumentClient } from 'aws-sdk/clients/dynamodb';

type ListAllTrailEvents = (trailId: string) => Promise<unknown[]>;

export const buildListAllTrailEvents =
  (documentClient: DocumentClient, tableName: string): ListAllTrailEvents =>
  async trailId => {
    const { Items: events } = (await documentClient
      .query({
        TableName: tableName,
        KeyConditionExpression: 'PK = :PK and begins_with(SK, :SK)',
        ExpressionAttributeValues: {
          ':PK': trailId,
          ':SK': 'EVENT#',
        },
      })
      .promise()) as unknown as {
      Items: { event: unknown; SK: string; PK: string }[];
    };

    return events.map(({ event }) => event);
  };
