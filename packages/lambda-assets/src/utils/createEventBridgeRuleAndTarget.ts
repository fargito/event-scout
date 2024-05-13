import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
} from '@aws-sdk/client-eventbridge';

import type { EventPattern } from '@event-scout/construct-contracts';

import { getRuleAndTargetName } from './getRuleAndTargetName';

type CreateEventBridgeRuleAndTarget = (args: {
  trailId: string;
  targetArn: string;
  eventPattern: EventPattern;
}) => Promise<void>;

type Args = {
  eventBridgeClient: EventBridgeClient;
  eventBusName: string;
};

export const buildCreateEventBridgeRuleAndTarget =
  ({ eventBridgeClient, eventBusName }: Args): CreateEventBridgeRuleAndTarget =>
  async ({ trailId, targetArn, eventPattern }) => {
    const { ruleName, targetName } = getRuleAndTargetName(trailId);

    // put a new rule
    await eventBridgeClient.send(
      new PutRuleCommand({
        EventBusName: eventBusName,
        Name: ruleName,
        EventPattern: JSON.stringify(eventPattern),
      }),
    );

    // create a new target
    await eventBridgeClient.send(
      new PutTargetsCommand({
        EventBusName: eventBusName,
        Rule: ruleName,
        Targets: [
          {
            Id: targetName,
            Arn: targetArn,
            // https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-transform-target-input.html
            InputTransformer: {
              InputTemplate: `
              {
                "id": <id>,
                "version": <version>,
                "account": <account>,
                "time": <time>,
                "region": <region>,
                "resources": <resources>,
                "source": <source>,
                "detail-type": <detail-type>,
                "detail": <detail>,
                "trailId": "${trailId}"
              }
            `,
              InputPathsMap: {
                id: '$.id',
                version: '$.version',
                account: '$.account',
                time: '$.time',
                region: '$.region',
                resources: '$.resources',
                source: '$.source',
                'detail-type': '$.detail-type',
                detail: '$.detail',
              },
            },
          },
        ],
      }),
    );
  };
