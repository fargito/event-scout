export const region = 'eu-west-1';

export const defaultEnvironment = 'dev';

/**
 * A set of shared parameters, scoped by stage. You can extend them to add other shared parameters between services.
 *
 * See https://www.serverless.com/framework/docs/providers/aws/guide/variables#referencing-parameters
 *
 * An empty string for a profile means that the default profile will be used
 */
export const sharedParams = {
  dev: { profile: 'event-scout-developer' },
  staging: { profile: '' },
  production: { profile: '' },
};
