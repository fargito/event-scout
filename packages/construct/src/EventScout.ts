import { RemovalPolicy } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';
import type { IEventBus } from 'aws-cdk-lib/aws-events';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import { TrailGarbageCollectorFunction } from './httpApiTrail/functions/trailGarbageCollector';
import { HttpApiTrail } from './httpApiTrail/httpApiTrail';
import { WebSocketTrail } from './webSocketTrail/webSocketTrail';

type EventScoutProps = {
  eventBus: IEventBus;
  stage?: string;
  /**
   * internal parameter, for tests only
   */
  __baseLambdaDirectory?: string;
};

export class EventScout extends Construct {
  httpEndpoint: string;
  /**
   * @deprecated use `httpEndpoint` instead
   */
  restEndpoint: string;
  webSocketEndpoint: string;

  /**
   * The construct to provide all necessary resources for EventScout.
   */
  constructor(
    scope: Construct,
    id: string,
    {
      eventBus,
      __baseLambdaDirectory: baseLambdaDirectory = __dirname,
      stage = 'dev',
    }: EventScoutProps,
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

    const logGroup = new LogGroup(this, 'Logs', {
      retention: RetentionDays.FIVE_DAYS,
      removalPolicy: RemovalPolicy.DESTROY, // do not keep log group if it is no longer included in a deployment
    });

    // Lambda to listen to trail items deletion and delete the eventBridge resources
    // therefore it is safe to not call the stop lambda
    new TrailGarbageCollectorFunction(this, 'TrailGarbageCollectorFunction', {
      table,
      eventBus,
      logGroup,
      baseLambdaDirectory,
    });

    // create all necessary resource
    const { httpEndpoint } = new HttpApiTrail(this, 'HttpApiTrail', {
      table,
      eventBus,
      logGroup,
      baseLambdaDirectory,
    });
    this.httpEndpoint = httpEndpoint;
    this.restEndpoint = httpEndpoint;

    const { webSocketEndpoint } = new WebSocketTrail(this, 'WebsocketTrail', {
      table,
      eventBus,
      logGroup,
      baseLambdaDirectory,
      stage,
    });
    this.webSocketEndpoint = webSocketEndpoint;
  }
}
