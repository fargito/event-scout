import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

import { EventScout } from '@event-scout/construct';

import {
  eventBusExportName,
  restApiEndpointExportName,
} from 'utils/exportNames';

interface TestProps {
  stage: string;
}

export class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & TestProps) {
    super(scope, id, props);

    const eventBus = new EventBus(this, 'EventBus');

    const { restEndpoint } = new EventScout(this, 'Watcher', {
      eventBus,
    });

    new CfnOutput(this, 'EventScoutEndpoint', {
      value: restEndpoint,
      description: 'Watcher endpoint',
      exportName: restApiEndpointExportName,
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBusName',
      exportName: eventBusExportName,
    });
  }
}
