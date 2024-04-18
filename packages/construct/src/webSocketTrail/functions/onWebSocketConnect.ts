import { Duration } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { join } from 'path';

type Props = {
  table: Table;
};

export class OnConnectFunction extends Construct {
  public function: LambdaFunction;

  constructor(scope: Construct, id: string, { table }: Props) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'OnConnect', {
      code: Code.fromAsset(join(__dirname, 'onWebSocketConnect.zip')),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(15),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        TEST_TABLE_NAME: table.tableName,
      },
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
