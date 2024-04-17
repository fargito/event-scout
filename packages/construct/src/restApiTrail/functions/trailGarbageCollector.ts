import { getCdkHandlerPath } from '@swarmion/serverless-helpers';
import { Aws, Duration, Fn } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  FilterCriteria,
  FilterRule,
  Runtime,
  StartingPosition,
} from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type Props = {
  table: Table;
  eventBus: IEventBus;
};

export class TrailGarbageCollectorFunction extends Construct {
  public function: NodejsFunction;

  constructor(scope: Construct, id: string, { table, eventBus }: Props) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'TrailGarbageCollector', {
      entry: getCdkHandlerPath(__dirname, {
        // due to bundling, we need to reference the generated entrypoint. This is because of esbuild.build.js
        extension: 'js',
        fileName: 'trailGarbageCollector',
      }),
      handler: 'main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      timeout: Duration.minutes(1),
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [
            Fn.join(':', [
              'arn',
              Aws.PARTITION,
              'events',
              Aws.REGION,
              Aws.ACCOUNT_ID,
              Fn.join('/', ['rule', eventBus.eventBusName, '*']),
            ]),
          ],
          actions: ['events:DeleteRule', 'events:RemoveTargets'],
        }),
      ],
      events: [
        new DynamoEventSource(table, {
          startingPosition: StartingPosition.TRIM_HORIZON,
          batchSize: 1,
          filters: [
            FilterCriteria.filter({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              eventName: FilterRule.isEqual('REMOVE'),
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              dynamodb: { Keys: { SK: { S: FilterRule.isEqual('TRAIL') } } },
            }),
          ],
          retryAttempts: 3,
        }),
      ],
    });
  }
}
