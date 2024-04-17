import { getCdkHandlerPath } from '@swarmion/serverless-helpers';
import {
  AuthorizationType,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type Props = {
  table: Table;
  restApi: RestApi;
};

export class ListEventsFunction extends Construct {
  public function: NodejsFunction;

  constructor(scope: Construct, id: string, { table, restApi }: Props) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'ListEvents', {
      entry: getCdkHandlerPath(__dirname, {
        // due to bundling, we need to reference the generated entrypoint. This is because of esbuild.build.js
        extension: 'js',
        fileName: 'listEvents',
      }),
      handler: 'main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      environment: {
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
