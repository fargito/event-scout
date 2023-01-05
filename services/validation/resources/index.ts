import * as cdk from 'aws-cdk-lib';

import { defaultEnvironment } from '@event-scout/serverless-configuration';

import { TestStack } from './stack';

const app = new cdk.App();
const stage =
  (app.node.tryGetContext('stage') as string | undefined) ?? defaultEnvironment;

new TestStack(app, `validation-${stage}`, { stage });
