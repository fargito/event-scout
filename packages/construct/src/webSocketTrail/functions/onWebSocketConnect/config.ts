import { getCdkHandlerPath } from '@swarmion/serverless-helpers';
import { Duration } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { BundlingOptions, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type Props = {
  table: Table;
  bundling: BundlingOptions;
};

export class OnConnectFunction extends Construct {
  public function: NodejsFunction;

  constructor(scope: Construct, id: string, { table, bundling }: Props) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'OnConnect', {
      entry: getCdkHandlerPath(__dirname, { extension: 'js' }),
      handler: 'main',
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      bundling,
      timeout: Duration.seconds(15),
      environment: {
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
