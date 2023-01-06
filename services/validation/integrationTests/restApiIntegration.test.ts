import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { randomUUID } from 'crypto';

import { EventScoutClient } from '@event-scout/client';

describe('E2E integration test', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const eventScoutClient: EventScoutClient = globalThis.eventScoutClient;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const eventBridgeClient: EventBridgeClient = globalThis.eventBridgeClient;
  const eventBusName = globalThis.eventBusName;

  const source = 'my-app.toto';
  const detailType = 'MY_EVENT';
  const runId = randomUUID();

  beforeAll(
    async () => {
      await eventScoutClient.start({
        eventPattern: {
          source: [source],
          'detail-type': [detailType],
          detail: {
            runId: [runId],
          },
        },
      });
    },
    30 * 1000, // 30s timeout
  );

  it('should capture events matching our pattern', async () => {
    await eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          // a matching event
          {
            EventBusName: eventBusName,
            Source: source,
            DetailType: detailType,
            Detail: JSON.stringify({ toto: 'tata', runId }),
          },
          // wrong eventBus
          {
            Source: source,
            DetailType: detailType,
            Detail: JSON.stringify({ toto: 'tata', runId }),
          },
          // wrong source
          {
            EventBusName: eventBusName,
            Source: 'another.source',
            DetailType: detailType,
            Detail: JSON.stringify({ toto: 'tata', runId }),
          },
          // wrong detail-type
          {
            EventBusName: eventBusName,
            Source: source,
            DetailType: 'ANOTHER_EVENT_TYPE',
            Detail: JSON.stringify({ toto: 'tata', runId }),
          },
          // wrong detail
          {
            EventBusName: eventBusName,
            Source: source,
            DetailType: detailType,
            Detail: JSON.stringify({ toto: 'tata', runId: 'blob' }),
          },
        ],
      }),
    );

    // we want the give time to the async process, say 10s
    await new Promise(r => setTimeout(r, 10 * 1000));

    const messages = await eventScoutClient.query();

    expect(messages).toHaveLength(1);

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source,
          'detail-type': detailType,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          detail: expect.objectContaining({
            toto: 'tata',
            runId,
          }),
        }),
      ]),
    );
  });

  afterAll(async () => {
    await eventScoutClient.stop();
  });
});
