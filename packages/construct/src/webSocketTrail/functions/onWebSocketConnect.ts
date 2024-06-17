import { Duration } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  LoggingFormat,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import type { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

type Props = {
  table: Table;
  logGroup: ILogGroup;
};

export class OnConnectFunction extends Construct {
  public function: LambdaFunction;

  constructor(scope: Construct, id: string, { table, logGroup }: Props) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'OnConnect', {
      code: Code.fromAsset(
        require.resolve('@event-scout/lambda-assets/onWebSocketConnect'),
      ),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(15),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        EVENT_SCOUT_TABLE_NAME: table.tableName,
      },
      loggingFormat: LoggingFormat.JSON,
      logGroup,
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [table.tableArn],
          actions: ['dynamodb:PutItem'],
        }),
      ],
    });
  }
}
