import { Aws, Fn } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpIamAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  LogFormat,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import type { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import { StoreEventsFunction } from './functions/storeEvents';

type HttpApiTrailProps = {
  table: Table;
  eventBus: IEventBus;
  logGroup: ILogGroup;
};

type LambdaConfig = {
  codePath: string;
  policy: PolicyStatement[];
  httpPath: string;
  httpMethod: HttpMethod;
};

export class HttpApiTrail extends Construct {
  httpEndpoint: string;

  /**
   * all the required resources to implement the HTTP api trail, i.e. that
   * can be queried by calling an HTTP endpoint.
   *
   * This is the recommended way for testing
   */
  constructor(
    scope: Construct,
    id: string,
    { table, eventBus, logGroup }: HttpApiTrailProps,
  ) {
    super(scope, id);

    // Add API
    const httpApi = new HttpApi(this, 'HttpApi', {
      defaultAuthorizer: new HttpIamAuthorizer(),
    });
    this.httpEndpoint = httpApi.url as string;

    // Lambda to store events in DynamoDB
    const { function: storeEvents } = new StoreEventsFunction(
      this,
      'StoreEvents',
      { table, eventBus, logGroup },
    );

    const syncLambdas: Record<string, LambdaConfig> = {
      StartEventsTrail: {
        codePath: 'startEventsTrail',
        httpMethod: HttpMethod.POST,
        httpPath: '/start-events-trail',
        policy: [
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
      },
      StopEventsTrail: {
        codePath: 'stopEventsTrail',
        httpMethod: HttpMethod.POST,
        httpPath: '/stop-events-trail',
        policy: [
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
      },
      ListEvents: {
        codePath: 'listEvents',
        httpMethod: HttpMethod.GET,
        httpPath: '/trail/{trailId}',
        policy: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [table.tableArn],
            actions: ['dynamodb:Query'],
          }),
        ],
      },
    };

    // HTTP Lambdas config
    Object.entries(syncLambdas).map(([lambdaName, lambdaConfig]) => {
      // create the lambda
      const lambda = new LambdaFunction(this, lambdaName, {
        architecture: Architecture.ARM_64,
        runtime: Runtime.NODEJS_20_X,
        code: Code.fromAsset(
          require.resolve(
            `@event-scout/lambda-assets/${lambdaConfig.codePath}`,
          ),
        ),
        handler: 'handler.main',
        memorySize: 1024,
        logFormat: LogFormat.JSON,
        logGroup,
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          EVENT_SCOUT_TABLE_NAME: table.tableName,
          EVENT_BUS_NAME: eventBus.eventBusName,
          STORE_EVENTS_LAMBDA_ARN: storeEvents.functionArn,
        },
        initialPolicy: lambdaConfig.policy,
      });

      // add it to the http api
      httpApi.addRoutes({
        path: lambdaConfig.httpPath,
        methods: [lambdaConfig.httpMethod],
        integration: new HttpLambdaIntegration(
          `${lambdaName}Integration`,
          lambda,
        ),
      });
    });
  }
}
