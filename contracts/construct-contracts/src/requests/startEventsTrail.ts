import { ApiGatewayContract } from '@swarmion/serverless-contracts';
import { FromSchema } from 'json-schema-to-ts';

const eventPatternSchema = {
  type: 'object',
  properties: {
    version: { type: 'array', items: { type: 'string' } },
    id: { type: 'array', items: { type: 'string' } },
    'detail-type': { type: 'array', items: { type: 'string' } },
    source: { type: 'array', items: { type: 'string' } },
    account: { type: 'array', items: { type: 'string' } },
    time: { type: 'array', items: { type: 'string' } },
    region: { type: 'array', items: { type: 'string' } },
    resources: { type: 'array', items: { type: 'string' } },
    detail: { type: 'object' },
  },
  required: [],
  additionalProperties: false,
} as const;

export type EventPattern = FromSchema<typeof eventPatternSchema>;

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
