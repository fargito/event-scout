import { getCdkHandlerPath } from '@swarmion/serverless-helpers';
import { Aws, Fn } from 'aws-cdk-lib';
import { WebSocketApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, CfnPermission, Runtime } from 'aws-cdk-lib/aws-lambda';
import { BundlingOptions, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type Props = {
  bundling: BundlingOptions;
  eventBus: IEventBus;
  webSocketApi: WebSocketApi;
  webSocketEndpoint: string;
};

export class ForwardEventFunction extends Construct {
  public function: NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    { bundling, eventBus, webSocketApi, webSocketEndpoint }: Props,
  ) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'OnNewWebsocketEvent', {
      entry: getCdkHandlerPath(__dirname, {
        // due to bundling, we need to reference the generated entrypoint. This is because of tsup.config.ts
        extension: 'js',
        fileName: 'forwardEvent',
      }),
      handler: 'main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      bundling,
      environment: {
        WEBSOCKET_ENDPOINT: webSocketEndpoint,
      },
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
