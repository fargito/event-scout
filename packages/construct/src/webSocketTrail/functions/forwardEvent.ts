import { Aws, Fn } from 'aws-cdk-lib';
import { WebSocketApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  CfnPermission,
  Code,
  Function as LambdaFunction,
  LogFormat,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { join } from 'path';

type Props = {
  eventBus: IEventBus;
  logGroup: ILogGroup;
  baseLambdaDirectory: string;
  webSocketApi: WebSocketApi;
  webSocketEndpoint: string;
};

export class ForwardEventFunction extends Construct {
  public function: LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    {
      eventBus,
      logGroup,
      baseLambdaDirectory,
      webSocketApi,
      webSocketEndpoint,
    }: Props,
  ) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'OnNewWebsocketEvent', {
      code: Code.fromAsset(join(baseLambdaDirectory, 'forwardEvent.zip')),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        WEBSOCKET_ENDPOINT: webSocketEndpoint,
      },
      logFormat: LogFormat.JSON,
      logGroup,
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [
            `arn:aws:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${webSocketApi.apiId}/*`,
          ],
          actions: ['execute-api:ManageConnections'],
        }),
      ],
    });

    // enable **any** rule on our bus to trigger the lambda
    new CfnPermission(this, 'Permission', {
      action: 'lambda:InvokeFunction',
      functionName: this.function.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: Fn.join(':', [
        'arn',
        Aws.PARTITION,
        'events',
        Aws.REGION,
        Aws.ACCOUNT_ID,
        Fn.join('/', ['rule', eventBus.eventBusName, '*']),
      ]),
    });
  }
}
