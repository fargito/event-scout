import { Aws, Duration, Fn } from 'aws-cdk-lib';
import {
  AuthorizationType,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
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
  eventBus: IEventBus;
};

export class StopEventsTrailFunction extends Construct {
  public function: LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, restApi, eventBus }: Props,
  ) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'StopEventsTrail', {
      code: Code.fromAsset(join(__dirname, 'stopEventsTrail.zip')),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(15),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        TEST_TABLE_NAME: table.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [table.tableArn],
          actions: ['dynamodb:DeleteItem'],
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
          actions: ['events:DeleteRule', 'events:RemoveTargets'],
        }),
      ],
    });

    const trail = restApi.root.addResource('stop-events-trail');
    trail.addMethod('POST', new LambdaIntegration(this.function), {
      authorizationType: AuthorizationType.IAM,
    });
  }
}
