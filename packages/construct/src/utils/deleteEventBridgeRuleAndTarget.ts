import {
  DeleteRuleCommand,
  EventBridgeClient,
  RemoveTargetsCommand,
} from '@aws-sdk/client-eventbridge';

type Args = {
  eventBridgeClient: EventBridgeClient;
  eventBusName: string;
};

type DeleteEventBridgeRuleAndTarget = (trailId: string) => Promise<void>;

export const buildDeleteEventBridgeRuleAndTarget =
  ({ eventBridgeClient, eventBusName }: Args): DeleteEventBridgeRuleAndTarget =>
  async trailId => {
    const ruleName = `test-rule-${trailId}`;
    const targetName = `test-target-${trailId}`;

    try {
      // remove the target
      await eventBridgeClient.send(
        new RemoveTargetsCommand({
          Ids: [targetName],
          Rule: ruleName,
          EventBusName: eventBusName,
        }),
      );
    } catch (e) {
      // check if the error is non existing
      // @ts-ignore https://aws.amazon.com/blogs/developer/service-error-handling-modular-aws-sdk-js/
      if (e.name !== 'ResourceNotFoundException') {
        throw e;
      }

      console.log(`Target ${targetName} has already been deleted, skipping`);
    }

    try {
      // delete the rule
      await eventBridgeClient.send(
        new DeleteRuleCommand({
          EventBusName: eventBusName,
          Name: ruleName,
        }),
      );

      console.log(`Deleted rule ${ruleName}`);
    } catch (e) {
      // check if rule does not exist
      // @ts-ignore https://aws.amazon.com/blogs/developer/service-error-handling-modular-aws-sdk-js/
      if (e.name !== 'ResourceNotFoundException') {
        throw e;
      }

      console.log(`Rule ${ruleName} has already been deleted, skipping`);
    }
  };
