import { RemovalPolicy } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

import { TrailGarbageCollectorFunction } from './restApiTrail/functions/trailGarbageCollector/config';
import { RestApiTrail } from './restApiTrail/restApiTrail';
import { WebSocketTrail } from './webSocketTrail/webSocketTrail';

type EventScoutProps = {
  eventBus: IEventBus;
  stage?: string;
};

export class EventScout extends Construct {
  restEndpoint: string;
  webSocketEndpoint: string;

  /**
   * The construct to provide all necessary resources for EventScout.
   */
  constructor(
    scope: Construct,
    id: string,
    { eventBus, stage = 'dev' }: EventScoutProps,
  ) {
    super(scope, id);

    // provision the Table
    const table = new Table(this, 'Table', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: '_ttl',
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Lambda to listen to trail items deletion and delete the eventBridge resources
    // therefore it is safe to not call the stop lambda
    new TrailGarbageCollectorFunction(this, 'TrailGarbageCollectorFunction', {
      table,
      eventBus,
    });

    // create all necessary resource
    const { restEndpoint } = new RestApiTrail(this, 'RestApiTrail', {
      table,
      eventBus,
      stage,
    });
    this.restEndpoint = restEndpoint;

    const { webSocketEndpoint } = new WebSocketTrail(this, 'WebsocketTrail', {
      table,
      eventBus,
      stage,
    });
    this.webSocketEndpoint = webSocketEndpoint;
  }
}
