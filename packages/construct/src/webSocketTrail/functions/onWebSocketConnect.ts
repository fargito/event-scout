import { Duration } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  LogFormat,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { join } from 'path';

type Props = {
  table: Table;
  logGroup: ILogGroup;
  baseLambdaDirectory: string;
};

export class OnConnectFunction extends Construct {
  public function: LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, logGroup, baseLambdaDirectory }: Props,
  ) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'OnConnect', {
      code: Code.fromAsset(join(baseLambdaDirectory, 'onWebSocketConnect.zip')),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(15),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        TEST_TABLE_NAME: table.tableName,
      },
      logFormat: LogFormat.JSON,
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
