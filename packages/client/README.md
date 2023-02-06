# @event-scout/client

Create and query event trails using EventScout.

This repository is part of [EventScout](https://github.com/fargito/event-scout).

## Installation

```bash
pnpm add -D @event-scout/client
```

or if using yarn

```
yarn add --dev @event-scout/client
```

or if using npm

```
npm install --save-dev @event-scout/client
```

## Use EventScout in your tests

### Create a client

In order to use the EventScout client, you will need:

- the `endpoint` exported by [@event-scout/construct](https://github.com/fargito/event-scout/main/packages/construct/README.md)
- the AWS `region` in which you run your tests
- valid AWS `credentials`. Check out [the AWS SDK v3 docs on how to build credentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_credential_providers.html).

Instantiate the client:

```ts
const eventScoutClient = new EventScoutClient({
  credentials,
  region,
  endpoint: eventScoutEndpoint,
});
```

### Start an events trail

A trail is a list of events with a certain patterns, that you can dynamically create.

At the beginning of the test, start a trail with a custom pattern:

```ts
beforeAll(
  async () => {
    await eventScoutClient.start({
      eventPattern: {
        source: ['my-pattern'],
        'detail-type': ['MY_DETAIL_TYPE'],
      },
    });
  },
  30 * 1000, // 30s timeout
);
```

You can put any valid EventBridge pattern here, including content filtering. Check [the AWS docs](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html) for more details.

⚠ In order for the resources to be properly activated, the EventScout client will wait for 20 seconds before returning. We advise to set a **30 seconds timeout** on the `beforeAll` method.

### Query the trail messages

In your tests, simply call the `.query()` method to retrieve events in the trail.

```ts
const messages = await eventScoutClient.query();
```

This will return all the events in the trail! You are then free to make assertions on them.

### Cleanup

At the end of the test, call the `.stop()` method in `afterAll`:

```ts
afterAll(async () => {
  await eventScoutClient.stop();
});
```
