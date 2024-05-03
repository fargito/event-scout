import { Sha256 } from '@aws-crypto/sha256-js';
import type { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { SignatureV4 } from '@smithy/signature-v4';
import WebSocket from 'ws';

import type { EventPattern } from '@event-scout/construct-contracts';

type ListenToWebSocketArgs = {
  webSocketEndpoint: string;
  credentials: AwsCredentialIdentityProvider;
  region: string;
  eventPattern: EventPattern;
};

export const listenToWebSocket = async ({
  webSocketEndpoint,
  region,
  credentials,
  eventPattern,
}: ListenToWebSocketArgs): Promise<void> => {
  const service = 'execute-api';

  const signatureV4 = new SignatureV4({
    service,
    region,
    credentials,
    sha256: Sha256,
  });
  await Promise.resolve(webSocketEndpoint);

  const webSocketUrl = new URL(webSocketEndpoint);

  const presignedRequest = await signatureV4.presign({
    method: 'GET',
    hostname: webSocketUrl.host,
    path: webSocketUrl.pathname,
    protocol: webSocketUrl.protocol,
    headers: {
      host: webSocketUrl.hostname, // compulsory for signature
    },
  });

  const queryParams = presignedRequest.query;

  // we need to update the URL with the signed query from the presigned request
  if (queryParams !== undefined) {
    const signedSearchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        signedSearchParams.append(key, value);
      }
    });
    webSocketUrl.search = signedSearchParams.toString();
  }

  const client = new WebSocket(webSocketUrl);
  client.on('open', () => {
    console.log('Connection established...');

    client.send(
      JSON.stringify({
        action: 'startTrail',
        eventPattern,
      }),
    );
  });

  client.on('error', error => console.error('error', error));

  client.on('message', data => {
    const message = data.toLocaleString();
    const formattedMessage = JSON.stringify(JSON.parse(message), null, 4);
    console.log(formattedMessage);
  });
};
