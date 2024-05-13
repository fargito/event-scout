import { Aws, Duration, Fn } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  Code,
  FilterCriteria,
  FilterRule,
  Function as LambdaFunction,
  LogFormat,
  Runtime,
  StartingPosition,
} from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import type { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

type Props = {
  table: Table;
  eventBus: IEventBus;
  logGroup: ILogGroup;
};

export class TrailGarbageCollectorFunction extends Construct {
  public function: LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, eventBus, logGroup }: Props,
  ) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'TrailGarbageCollector', {
      code: Code.fromAsset(
        require.resolve('@event-scout/lambda-assets/trailGarbageCollector'),
      ),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(1),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      logFormat: LogFormat.JSON,
      logGroup,
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
