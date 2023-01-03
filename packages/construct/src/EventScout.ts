import { RemovalPolicy } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { RestApiTrail } from 'constructs/restApiTrail';

import { defaultEsbuildConfig } from './utils/esbuildConfig';

type EventScoutProps = {
  eventBus: IEventBus;
  bundling?: Partial<BundlingOptions>;
};

export class EventScout extends Construct {
  endpoint: string;

  /**
   * The construct to provide all necessary resources for EventScout.
   */
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
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // create all necessary resource
    const { endpoint } = new RestApiTrail(this, 'RestApiTrail', {
      table,
      eventBus,
      bundling,
    });
    this.endpoint = endpoint;
  }
}
