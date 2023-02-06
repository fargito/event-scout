import { getCdkHandlerPath } from '@swarmion/serverless-helpers';
import { Aws, Fn } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, CfnPermission, Runtime } from 'aws-cdk-lib/aws-lambda';
import { BundlingOptions, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type Props = { table: Table; bundling: BundlingOptions; eventBus: IEventBus };

export class StoreEventsFunction extends Construct {
  public function: NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, bundling, eventBus }: Props,
  ) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'StoreEvents', {
      entry: getCdkHandlerPath(__dirname, {
        // due to bundling, we need to reference the generated entrypoint. This is because of tsup.config.ts
        extension: 'js',
        fileName: 'storeEvents',
      }),
      handler: 'main',
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      bundling,
      environment: {
        TEST_TABLE_NAME: table.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [table.tableArn],
          actions: ['dynamodb:PutItem'],
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
