import type { FromSchema } from 'json-schema-to-ts';

import { eventPatternSchema } from 'entities/eventPattern';

export const startWebsocketEventTrailBodySchema = {
  type: 'object',
  properties: {
    eventPattern: eventPatternSchema,
  },
  required: ['eventPattern'],
} as const;

export type StartWebsocketEventTrailBody = FromSchema<
  typeof startWebsocketEventTrailBodySchema
>;
