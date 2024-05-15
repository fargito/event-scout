import { Aws, Duration, Fn } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  LogFormat,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import type { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

type Props = {
  table: Table;
  eventBus: IEventBus;
  logGroup: ILogGroup;
  forwardEvent: LambdaFunction;
};

export class OnStartTrailFunction extends Construct {
  public function: LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, eventBus, logGroup, forwardEvent }: Props,
  ) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'OnStartTrail', {
      code: Code.fromAsset(
        require.resolve('@event-scout/lambda-assets/onStartTrail'),
      ),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(15),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        EVENT_SCOUT_TABLE_NAME: table.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
        FORWARD_EVENT_LAMBDA_ARN: forwardEvent.functionArn,
      },
      logFormat: LogFormat.JSON,
      logGroup,
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [table.tableArn],
          actions: ['dynamodb:UpdateItem'],
        }),
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
          actions: ['events:PutRule', 'events:PutTargets'],
        }),
      ],
    });
  }
}
