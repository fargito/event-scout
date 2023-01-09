import { getCdkHandlerPath } from '@swarmion/serverless-helpers';
import { Aws, Fn } from 'aws-cdk-lib';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Architecture, CfnPermission, Runtime } from 'aws-cdk-lib/aws-lambda';
import { BundlingOptions, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type Props = { bundling: BundlingOptions; eventBus: IEventBus };

export class ForwardEventFunction extends Construct {
  public function: NodejsFunction;

  constructor(scope: Construct, id: string, { bundling, eventBus }: Props) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'OnNewWebsocketEvent', {
      entry: getCdkHandlerPath(__dirname, { extension: 'js' }),
      handler: 'main',
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      bundling,
      environment: {},
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
