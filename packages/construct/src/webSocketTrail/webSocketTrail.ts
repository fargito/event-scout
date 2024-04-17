import { WebSocketApi, WebSocketStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketIamAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

import { ForwardEventFunction } from './functions/forwardEvent/config';
import { OnStartTrailFunction } from './functions/onStartTrail/config';
import { OnConnectFunction } from './functions/onWebSocketConnect/config';
import { OnDisconnectFunction } from './functions/onWebSocketDisconnect/config';

type WebSocketTrailProps = {
  table: Table;
  eventBus: IEventBus;
  stage: string;
};

export class WebSocketTrail extends Construct {
  webSocketEndpoint: string;
  /**
   * all the required resources to implement the websocket trail
   *
   * This is the recommended method for developing
   */
  constructor(
    scope: Construct,
    id: string,
    { table, eventBus, stage }: WebSocketTrailProps,
  ) {
    super(scope, id);

    const webSocketApi = new WebSocketApi(this, 'WebSocket');
    const webSocketEndpoint = `${webSocketApi.apiEndpoint}/${stage}`;
    this.webSocketEndpoint = webSocketEndpoint;

    const { function: forwardEvent } = new ForwardEventFunction(
      this,
      'ForwardEvent',
      { eventBus, webSocketApi, webSocketEndpoint },
    );

    const { function: onConnect } = new OnConnectFunction(this, 'OnConnect', {
      table,
    });

    const { function: onDisconnect } = new OnDisconnectFunction(
      this,
      'OnDisconnect',
      {
        table,
        eventBus,
      },
    );

    const { function: onStartTrail } = new OnStartTrailFunction(
      this,
      'OnStartTrail',
      { table, eventBus, forwardEvent },
    );

    // create routes for API Gateway
    webSocketApi.addRoute('$connect', {
      integration: new WebSocketLambdaIntegration(
        'ConnectIntegration',
        onConnect,
      ),
      authorizer: new WebSocketIamAuthorizer(),
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
