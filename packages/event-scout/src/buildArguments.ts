import { fromEnv, fromIni } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import Ajv from 'ajv';
import type { OptionValues } from 'commander';

import {
  type EventPattern,
  eventPatternSchema,
} from '@event-scout/construct-contracts';

type ParsedArgs = {
  webSocketEndpoint: string;
  credentials: AwsCredentialIdentityProvider;
  region: string;
  eventPattern: EventPattern;
};

export const buildArguments = (options: OptionValues): ParsedArgs => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const profileArg: string | undefined = options.awsProfile;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const regionArg: string | undefined = options.awsRegion;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const endpointArg: string | undefined = options.endpoint;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const patternArg: string | undefined = options.pattern;

  const credentials =
    profileArg !== undefined ? fromIni({ profile: profileArg }) : fromEnv();

  const region = regionArg ?? 'eu-west-1';

  // TODO retrieve the endpoint
  const webSocketEndpoint = endpointArg ?? '';

  // build and validate pattern
  const ajv = new Ajv();
  const validate = ajv.compile<EventPattern>(eventPatternSchema);

  // parse and validate the event pattern
  const eventPattern =
    patternArg !== undefined ? (JSON.parse(patternArg) as unknown) : {};

  if (!validate(eventPattern)) {
    console.error(validate.errors);
    throw new Error('Invalid pattern');
  }

  return { credentials, eventPattern, region, webSocketEndpoint };
};
