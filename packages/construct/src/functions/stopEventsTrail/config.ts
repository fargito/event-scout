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
};

export class StopEventsTrailFunction extends Construct {
  public function: NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, bundling, restApi, eventBus }: Props,
  ) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'StopEventsTrail', {
      entry: getCdkHandlerPath(__dirname, { extension: 'js' }),
      handler: 'main',
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      bundling,
      timeout: Duration.seconds(15),
      environment: {
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
