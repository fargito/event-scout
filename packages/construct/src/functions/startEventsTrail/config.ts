import { Aws, Duration, Fn } from 'aws-cdk-lib';
import {
  AuthorizationType,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { BundlingOptions, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { getCdkHandlerPath } from '../../utils/getCdkHandlerPath';

type Props = {
  table: Table;
  bundling: BundlingOptions;
  restApi: RestApi;
  eventBus: IEventBus;
  storeEvents: NodejsFunction;
};

export class StartEventsTrailFunction extends Construct {
  public function: NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, bundling, restApi, eventBus, storeEvents }: Props,
  ) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'StartEventsTrail', {
      entry: getCdkHandlerPath(__dirname, { extension: 'js' }),
      handler: 'main',
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      timeout: Duration.seconds(15),
      bundling,
      environment: {
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
