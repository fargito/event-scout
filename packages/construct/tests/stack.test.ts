import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { EventBus } from 'aws-cdk-lib/aws-events';

import { EventScout } from '../src/EventScout';

test('Resources are properly created', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack');

  const eventBus = new EventBus(stack, 'EventBus');

  new EventScout(stack, 'EventScout', {
    eventBus,
  });

  const template = Template.fromStack(stack);

  template.allResourcesProperties('AWS::Lambda::Function', {
    // all functions should have arm64 architecture
    Architectures: ['arm64'],
    // all functions should have json logging
    LoggingConfig: { LogFormat: 'JSON' },
    // all functions should have the same runtime
    Runtime: 'nodejs20.x',
  });

  // we should only have one log group
  template.resourceCountIs('AWS::Logs::LogGroup', 1);
});
