import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

import { EventScout } from '@event-scout/construct';

import {
  eventBusExportName,
  restApiEndpointExportName,
  websocketEndpointExportName,
} from 'utils/exportNames';

interface TestProps {
  stage: string;
}

export class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & TestProps) {
    super(scope, id, props);

    const eventBus = new EventBus(this, 'EventBus');

    const { restEndpoint, webSocketEndpoint } = new EventScout(
      this,
      'Watcher',
      {
        eventBus,
      },
    );

    new CfnOutput(this, 'EventScoutEndpoint', {
      value: restEndpoint,
      description: 'Watcher endpoint',
      exportName: restApiEndpointExportName,
    });

    new CfnOutput(this, 'EventScoutWebSocket', {
      value: webSocketEndpoint,
      description: 'Watcher WS endpoint',
      exportName: websocketEndpointExportName,
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBusName',
      exportName: eventBusExportName,
    });
  }
}
