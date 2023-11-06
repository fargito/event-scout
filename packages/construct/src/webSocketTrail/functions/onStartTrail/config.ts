import { getCdkHandlerPath } from '@swarmion/serverless-helpers';
import { Aws, Duration, Fn } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { BundlingOptions, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type Props = {
  table: Table;
  bundling: BundlingOptions;
  eventBus: IEventBus;
  forwardEvent: NodejsFunction;
};

export class OnStartTrailFunction extends Construct {
  public function: NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    { table, bundling, eventBus, forwardEvent }: Props,
  ) {
    super(scope, id);

    this.function = new NodejsFunction(this, 'OnStartTrail', {
      entry: getCdkHandlerPath(__dirname, {
        // due to bundling, we need to reference the generated entrypoint. This is because of tsup.config.ts
        extension: 'js',
        fileName: 'onStartTrail',
      }),
      handler: 'main',
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      awsSdkConnectionReuse: true,
      bundling,
      timeout: Duration.seconds(15),
      environment: {
        TEST_TABLE_NAME: table.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
        FORWARD_EVENT_LAMBDA_ARN: forwardEvent.functionArn,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [table.tableArn],
          actions: ['dynamodb:UpdateItem'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [
            Fn.join(':', [
              'arn',
              Aws.PARTITION,
              'events',
              Aws.REGION,
              Aws.ACCOUNT_ID,
              Fn.join('/', ['rule', eventBus.eventBusName, '*']),
            ]),
          ],
          actions: ['events:PutRule', 'events:PutTargets'],
        }),
      ],
    });
  }
}
