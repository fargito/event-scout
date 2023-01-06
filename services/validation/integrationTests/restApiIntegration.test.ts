import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

import { EventScoutClient } from '@event-scout/client';

describe('E2E integration test', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const eventScoutClient: EventScoutClient = globalThis.eventScoutClient;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const eventBridgeClient: EventBridgeClient = globalThis.eventBridgeClient;
  const eventBusName = globalThis.eventBusName;

  beforeAll(
    async () => {
      await eventScoutClient.start({
        eventPattern: {
          source: ['myapp.toto'],
        },
      });
    },
    30 * 1000, // 30s timeout
  );

  it('should capture events matching our pattern', async () => {
    await eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: eventBusName,
            Source: 'myapp.toto',
            DetailType: 'COUCOU',
            Detail: JSON.stringify({ toto: 'tata' }),
          },
        ],
      }),
    );

    // we want the give time to the async process, say 10s
    await new Promise(r => setTimeout(r, 10 * 1000));

    const messages = await eventScoutClient.query();

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          'detail-type': 'COUCOU',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          detail: expect.objectContaining({
            toto: 'tata',
          }),
        }),
      ]),
    );
  });

  afterAll(async () => {
    await eventScoutClient.stop();
  });
});
