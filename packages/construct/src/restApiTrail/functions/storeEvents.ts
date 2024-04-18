import { Aws, Fn } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  CfnPermission,
  Code,
  Function as LambdaFunction,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { join } from 'path';

type Props = { table: Table; eventBus: IEventBus };

export class StoreEventsFunction extends Construct {
  public function: LambdaFunction;

  constructor(scope: Construct, id: string, { table, eventBus }: Props) {
    super(scope, id);

    this.function = new LambdaFunction(this, 'StoreEvents', {
      code: Code.fromAsset(join(__dirname, 'storeEvents.zip')),
      handler: 'handler.main',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
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
