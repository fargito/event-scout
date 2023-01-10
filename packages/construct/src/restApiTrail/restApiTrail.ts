import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { ListEventsFunction } from './functions/listEvents/config';
import { StartEventsTrailFunction } from './functions/startEventsTrail/config';
import { StopEventsTrailFunction } from './functions/stopEventsTrail/config';
import { StoreEventsFunction } from './functions/storeEvents/config';

type RestApiTrailProps = {
  table: Table;
  bundling: BundlingOptions;
  eventBus: IEventBus;
};

export class RestApiTrail extends Construct {
  endpoint: string;

  /**
   * all the required resources to implement the rest api trail, i.e. that
   * can be queried by calling a REST endpoint.
   *
   * This is the recommended way for testing
   */
  constructor(
    scope: Construct,
    id: string,
    { table, bundling, eventBus }: RestApiTrailProps,
  ) {
    super(scope, id);

    // add Api
    const restApi = new RestApi(this, 'RestApi');
    this.endpoint = restApi.url;

    // Lambda to store events in DynamoDB
    const { function: storeEvents } = new StoreEventsFunction(
      this,
      'StoreEvents',
      { table, bundling, eventBus },
    );

    // Lambda to start a trail
    new StartEventsTrailFunction(this, 'StartEventsTrail', {
      table,
      bundling,
      restApi,
      eventBus,
      storeEvents,
    });

    // Lambda to stop a trail
    new StopEventsTrailFunction(this, 'StopEventsTrail', {
      table,
      bundling,
      restApi,
      eventBus,
    });

    // Lambda to list the events in the trail
    new ListEventsFunction(this, 'ListEvents', {
      table,
      bundling,
      restApi,
    });
  }
}
