import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

import { ListEventsFunction } from './functions/listEvents/config';
import { StartEventsTrailFunction } from './functions/startEventsTrail/config';
import { StopEventsTrailFunction } from './functions/stopEventsTrail/config';
import { StoreEventsFunction } from './functions/storeEvents/config';

type RestApiTrailProps = {
  table: Table;
  eventBus: IEventBus;
  stage: string;
};

export class RestApiTrail extends Construct {
  restEndpoint: string;

  /**
   * all the required resources to implement the rest api trail, i.e. that
   * can be queried by calling a REST endpoint.
   *
   * This is the recommended way for testing
   */
  constructor(
    scope: Construct,
    id: string,
    { table, eventBus, stage }: RestApiTrailProps,
  ) {
    super(scope, id);

    // add Api
    const restApi = new RestApi(this, 'RestApi', {
      deployOptions: { stageName: stage },
    });
    this.restEndpoint = restApi.url;

    // Lambda to store events in DynamoDB
    const { function: storeEvents } = new StoreEventsFunction(
      this,
      'StoreEvents',
      { table, eventBus },
    );

    // Lambda to start a trail
    new StartEventsTrailFunction(this, 'StartEventsTrail', {
      table,
      restApi,
      eventBus,
      storeEvents,
    });

    // Lambda to stop a trail
    new StopEventsTrailFunction(this, 'StopEventsTrail', {
      table,
      restApi,
      eventBus,
    });

    // Lambda to list the events in the trail
    new ListEventsFunction(this, 'ListEvents', {
      table,
      restApi,
    });
  }
}
