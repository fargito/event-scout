import { Sha256 } from '@aws-crypto/sha256-js';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { getRequestParameters } from '@swarmion/serverless-contracts';
import axios, { AxiosRequestConfig } from 'axios';

import {
  EventPattern,
  listEventsContract,
  startEventsTrailContract,
  stopEventsTrailContract,
} from '@event-scout/construct-contracts';

export class EventScoutClient {
  private endpoint: string;
  private trailId?: string;
  private signatureV4: SignatureV4;

  constructor({
    credentials,
    endpoint,
    region,
  }: {
    credentials: AwsCredentialIdentityProvider;
    endpoint: string;
    region: string;
  }) {
    this.endpoint = endpoint;

    this.signatureV4 = new SignatureV4({
      service: 'execute-api',
      region,
      credentials,
      sha256: Sha256,
    });
  }

  /**
   * Start an events trail with a specific pattern.
   *
   * @param eventPattern a valid eventBridge pattern. See https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html
   *
   * ⚠ this function will last for more than 20 seconds to ensure created resources are running.
   * We recommend setting a timeout value of 30 seconds in the calling method.
   */
  async start({
    eventPattern = {},
  }: {
    eventPattern?: EventPattern;
  }): Promise<void> {
    if (this.trailId !== undefined) {
      throw new Error('Only one trail can be started on a single client');
    }

    const url = this.endpoint + 'start-events-trail';

    const body = { eventPattern };

    const typedRequest = getRequestParameters(startEventsTrailContract, {
      body,
    });

    const config = await this.getSignedAxiosConfig(url, typedRequest);

    const {
      data: { trailId },
    } = await axios<{
      trailId: string;
    }>(config);

    this.trailId = trailId;

    // rule can take a few seconds to to enabled, waiting for 20 seconds
    await new Promise(r => setTimeout(r, 20 * 1000));
  }

  /**
   * Stop an events trail.
   *
   * This will immediately stop new events from being recorded in the trail.
   * However, this will not immediately remove all events from the trail, since they have a time to live of 15 minutes
   */
  async stop(): Promise<void> {
    if (this.trailId === undefined) {
      throw new Error('No trail found, did you forget to run .start()?');
    }

    const url = this.endpoint + 'stop-events-trail';
    const body = { trailId: this.trailId };

    const typedRequest = getRequestParameters(stopEventsTrailContract, {
      body,
    });

    const config = await this.getSignedAxiosConfig(url, typedRequest);

    await axios<{
      trailId: string;
    }>(config);
  }

  /**
   * Query the events in the trail.
   *
   * @returns events in trail. They have an `unknown` type on purpose, you have to make your own assertions.
   */
  async query(): Promise<unknown[]> {
    if (this.trailId === undefined) {
      throw new Error('No trail found, did you forget to run .start()?');
    }

    const trailId = this.trailId;

    const url = `${this.endpoint}trail/${trailId}`;

    const typedRequest = getRequestParameters(listEventsContract, {
      pathParameters: { trailId },
    });

    const config = await this.getSignedAxiosConfig(url, typedRequest);

    const { data: events } = await axios<unknown[]>(config);

    return events;
  }

  /**
   *
   * @param url
   * @param request
   * @returns a signed axios config, ready to be called with `axios(config)`
   */
  private async getSignedAxiosConfig(
    url: string,
    request: { path: string; method: string; body?: unknown },
  ): Promise<AxiosRequestConfig> {
    const apiUrl = new URL(url);

    if (request.body === undefined) {
      const signedRequest = await this.signatureV4.sign({
        method: request.method,
        hostname: apiUrl.host,
        path: apiUrl.pathname,
        protocol: apiUrl.protocol,
        headers: {
          'Content-Type': 'application/json',
          host: apiUrl.hostname, // compulsory for signature
        },
      });

      return {
        ...signedRequest,
        url,
      };
    } else {
      const body = JSON.stringify(request.body);

      const signedRequest = await this.signatureV4.sign({
        method: request.method,
        hostname: apiUrl.host,
        path: apiUrl.pathname,
        protocol: apiUrl.protocol,
        body,
        headers: {
          'Content-Type': 'application/json',
          host: apiUrl.hostname, // compulsory for signature
        },
      });

      return {
        ...signedRequest,
        url,
        data: body,
      };
    }
  }
}
