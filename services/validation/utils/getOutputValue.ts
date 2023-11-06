import {
  CloudFormationClient,
  ListExportsCommand,
} from '@aws-sdk/client-cloudformation';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';

type GetOutputValue = (exportName: string) => Promise<string>;

interface BuildGetOutputValueArgs {
  credentials: AwsCredentialIdentityProvider;
  region: string;
}

export const buildGetOutputValue = ({
  credentials,
  region,
}: BuildGetOutputValueArgs): GetOutputValue => {
  const cloudformationClient = new CloudFormationClient({
    region,
    credentials,
  });

  return async exportName => {
    const cfOutputs = await cloudformationClient.send(
      new ListExportsCommand({}),
    );

    const outputValue = cfOutputs.Exports?.find(
      cfOutput => cfOutput.Name === exportName,
    );

    if (outputValue?.Value === undefined) {
      throw new Error('unable to retrieve output value');
    }

    return outputValue.Value;
  };
};
