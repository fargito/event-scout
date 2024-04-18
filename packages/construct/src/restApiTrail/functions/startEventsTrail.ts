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
  storeEvents: LambdaFunction;
};

export class StartEventsTrailFunction extends Construct {
  public function: LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, restApi, eventBus, storeEvents }: Props,
  ) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'StartEventsTrail', {
      code: Code.fromAsset(join(__dirname, 'startEventsTrail.zip')),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(15),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        TEST_TABLE_NAME: table.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
        STORE_EVENTS_LAMBDA_ARN: storeEvents.functionArn,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [table.tableArn],
          actions: ['dynamodb:PutItem'],
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

    const trail = restApi.root.addResource('start-events-trail');
    trail.addMethod('POST', new LambdaIntegration(this.function), {
      authorizationType: AuthorizationType.IAM,
    });
  }
}
