import {
  ApiGatewayContract,
  HttpStatusCodes,
} from '@swarmion/serverless-contracts';

const bodySchema = {
  type: 'object',
  properties: {
    trailId: { type: 'string' },
  },
  required: ['trailId'],
  additionalProperties: false,
} as const;

const outputSchema = {
  type: 'object',
  properties: { trailId: { type: 'string' } },
  required: ['trailId'],
  additionalProperties: false,
} as const;

export const stopEventsTrailContract = new ApiGatewayContract({
  id: 'tests-stopEventsTrail',
  method: 'POST',
  path: '/stop-events-trail',
  integrationType: 'httpApi',
  authorizerType: 'aws_iam',
  pathParametersSchema: undefined,
  queryStringParametersSchema: undefined,
  headersSchema: undefined,
  bodySchema,
  outputSchemas: { [HttpStatusCodes.OK]: outputSchema },
});
