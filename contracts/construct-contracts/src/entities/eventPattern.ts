import { FromSchema } from 'json-schema-to-ts';

export const eventPatternSchema = {
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
