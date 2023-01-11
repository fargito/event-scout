# @event-scout/construct

Create resources necessary to use EventScout.

This repository is part of [EventScout](https://github.com/fargito/event-scout).

## Installation

```bash
pnpm add -D @event-scout/construct
```

or if using yarn

```
yarn add --dev @event-scout/construct
```

or if using npm

```
npm install --save-dev @event-scout/construct
```

## Deploy the resources

The resources for EventScout are only available through a CDK construct for the moment.

Instantiate the CDK construct:

```ts
import { EventScout } from '@event-scout/construct';
import { CfnOutput } from 'aws-cdk-lib';
import { EventBus } from 'aws-cdk-lib/aws-events';

// create the necessary resources
const { restEndpoint } = new EventScout(this, 'EventScout', {
  eventBus: EventBus.fromEventBusName(this, 'EventBus', eventBusName),
});

// export the endpoint value for easier use in tests
new CfnOutput(this, 'EventScoutEndpoint', {
  value: restEndpoint,
  description: 'EventScout endpoint',
  exportName: '<your export name>',
});
```

The export here will be useful to retrieve the EventScout endpoint for your tests.

⚠ Since the `EventScout` construct provisions Lambda, it must be deployed with the CDK and is not compatible with [@swarmion/serverless-cdk-plugin](https://github.com/swarmion/swarmion/tree/main/packages/serverless-contracts-plugin)
