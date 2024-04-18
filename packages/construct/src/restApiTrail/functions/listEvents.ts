import {
  AuthorizationType,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
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
  restApi: RestApi;
};

export class ListEventsFunction extends Construct {
  public function: LambdaFunction;

  constructor(scope: Construct, id: string, { table, restApi }: Props) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'ListEvents', {
      code: Code.fromAsset(join(__dirname, 'listEvents.zip')),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        TEST_TABLE_NAME: table.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [table.tableArn],
          actions: ['dynamodb:Query'],
        }),
      ],
    });

    const trail = restApi.root.addResource('trail').addResource('{trailId}');
    trail.addMethod('GET', new LambdaIntegration(this.function), {
      authorizationType: AuthorizationType.IAM,
    });
  }
}
