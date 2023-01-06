import { WebSocketApi, WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { OnStartTrailFunction } from './functions/onStartTrail/config';
import { OnConnectFunction } from './functions/onWebSocketConnect/config';
import { OnDisconnectFunction } from './functions/onWebSocketDisconnect/config';

type WebSocketTrailProps = {
  table: Table;
  bundling: BundlingOptions;
  eventBus: IEventBus;
};

export class WebSocketTrail extends Construct {
  /**
   * all the required resources to implement the websocket trail
   *
   * This is the recommended method for developing
   */
  constructor(
    scope: Construct,
    id: string,
    { bundling, table }: WebSocketTrailProps,
  ) {
    super(scope, id);

    const stage = 'dev';

    const webSocketApi = new WebSocketApi(this, 'Websocket');

    const { function: onConnect } = new OnConnectFunction(this, 'OnConnect', {
      bundling,
      table,
    });

    const { function: onDisconnect } = new OnDisconnectFunction(
      this,
      'OnDisconnect',
      {
        bundling,
        table,
      },
    );

    const { function: onStartTrail } = new OnStartTrailFunction(
      this,
      'OnStartTrail',
      { bundling, table },
    );

    // create routes for API Gateway
    webSocketApi.addRoute('$connect', {
      integration: new WebSocketLambdaIntegration(
        'ConnectIntegration',
        onConnect,
      ),
    });
    webSocketApi.addRoute('$disconnect', {
      integration: new WebSocketLambdaIntegration(
        'DisconnectIntegration',
        onDisconnect,
      ),
    });
    webSocketApi.addRoute('startTrail', {
      integration: new WebSocketLambdaIntegration(
        'StartTrailIntegration',
        onStartTrail,
      ),
    });

    new WebSocketStage(this, 'Stage', {
      webSocketApi,
      stageName: stage,
      autoDeploy: true,
    });
  }
}
