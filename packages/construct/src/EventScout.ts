import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { ListEventsFunction } from './functions/listEvents/config';
import { StartEventsTrailFunction } from './functions/startEventsTrail/config';
import { StopEventsTrailFunction } from './functions/stopEventsTrail/config';
import { StoreEventsFunction } from './functions/storeEvents/config';
import { TrailGarbageCollectorFunction } from './functions/trailGarbageCollector/config';
import { defaultEsbuildConfig } from './utils/esbuildConfig';

type EventScoutProps = {
  eventBus: IEventBus;
  bundling?: Partial<BundlingOptions>;
};

export class EventScout extends Construct {
  endpoint: string;

  constructor(
    scope: Construct,
    id: string,
    { eventBus, bundling: bundlingOverrides }: EventScoutProps,
  ) {
    super(scope, id);

    // merge the overrides with the default configuration
    const bundling = { ...defaultEsbuildConfig, ...bundlingOverrides };

    // provision the Table
    const table = new Table(this, 'Table', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: '_ttl',
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // add Api
    const restApi = new RestApi(this, 'RestApi');
    this.endpoint = restApi.url;

    // Lambda to store events in DynamoDB
    const { function: storeEvents } = new StoreEventsFunction(
      this,
      'StoreEvents',
      { table, bundling, eventBus },
    );

    // Lambda to start a trail
    new StartEventsTrailFunction(this, 'StartEventsTrail', {
      table,
      bundling,
      restApi,
      eventBus,
      storeEvents,
    });

    // Lambda to stop a trail
    new StopEventsTrailFunction(this, 'StopEventsTrail', {
      table,
      bundling,
      restApi,
      eventBus,
    });

    // Lambda to list the events in the trail
    new ListEventsFunction(this, 'ListEvents', {
      table,
      bundling,
      restApi,
    });

    // Lambda to listen to trail items deletion and delete the eventBridge resources
    // therefore it is safe to not call the stop lambda
    new TrailGarbageCollectorFunction(this, 'TrailGarbageCollectorFunction', {
      table,
      bundling,
      eventBus,
    });
  }
}
