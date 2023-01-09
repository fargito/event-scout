import { ApiGatewayContract } from '@swarmion/serverless-contracts';

import { eventPatternSchema } from 'entities/eventPattern';

const bodySchema = {
  type: 'object',
  properties: {
    eventPattern: eventPatternSchema,
  },
  required: ['eventPattern'],
  additionalProperties: false,
} as const;

const outputSchema = {
  type: 'object',
  properties: { trailId: { type: 'string' } },
  required: ['trailId'],
  additionalProperties: false,
} as const;

export const startEventsTrailContract = new ApiGatewayContract({
  id: 'tests-startEventsTrail',
  method: 'POST',
  path: '/start-events-trail',
  integrationType: 'restApi',
  authorizerType: 'aws_iam',
  pathParametersSchema: undefined,
  queryStringParametersSchema: undefined,
  headersSchema: undefined,
  bodySchema,
  outputSchema,
});
