import { WebSocketApi, WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { OnConnectFunction } from 'functions/onWebSocketConnect/config';
import { OnDisconnectFunction } from 'functions/onWebSocketDisconnect/config';

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

    const webSocketApi = new WebSocketApi(this, 'websocket');
    new WebSocketStage(this, 'Stage', {
      webSocketApi,
      stageName: 'dev',
      autoDeploy: true,
    });

    new OnConnectFunction(this, 'OnConnect', {
      bundling,
      table,
      webSocketApi,
    });

    new OnDisconnectFunction(this, 'OnDisconnect', {
      bundling,
      table,
      webSocketApi,
    });
  }
}
