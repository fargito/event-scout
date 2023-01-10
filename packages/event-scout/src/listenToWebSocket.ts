import { Sha256 } from '@aws-crypto/sha256-js';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import WebSocket from 'ws';

type ListenToWebSocketArgs = {
  webSocketEndpoint: string;
  credentials: AwsCredentialIdentityProvider;
  region: string;
};

export const listenToWebSocket = async ({
  webSocketEndpoint,
  region,
  credentials,
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
        eventPattern: { source: ['toto'] },
      }),
    );
  });
  client.on('error', error => console.error('error', error));
  client.on('message', data => {
    const message = data.toString();
    console.log(message);
  });
};
