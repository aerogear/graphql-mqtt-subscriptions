import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { connect } from 'mqtt';
import { MQTTPubSub } from '../mqtt-pubsub';
import { fail } from 'assert';


chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;

const mqttClient = connect('mqtt://localhost');
const pubsub = new MQTTPubSub({
  client: mqttClient,
});

const sampleData = { data: 'here' };


describe('Integration MQTT subscriptions', () => {
  before('connection to running server', function (done) {
    mqttClient.on('connect', () => {
      done();
    });
  });

  it('Test single subscribe', (done) => {
    const SOMETHING_CHANGED_TOPIC = 'something_changed';
    let clientId;

    // Asserts here
    let callback = (message) => {
      assert(message, 'Message published');
      expect(message.data).to.equals(sampleData.data);
      if (clientId) {
        const unsubscribedPromise = pubsub.unsubscribe(clientId);
        // tslint:disable-next-line:no-unused-expression
        expect(unsubscribedPromise).to.eventually.be.fulfilled;
      }
      done();
    };
    pubsub.subscribe(SOMETHING_CHANGED_TOPIC, callback).then((id) => {
      clientId = id;
      pubsub.publish(SOMETHING_CHANGED_TOPIC, sampleData);
    });
  });


  it('Test async iterator subscribe', (done) => {
    const SOMETHING_CHANGED_TOPIC = 'another_change';
    const iterator = pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC);
    setTimeout(() => {
      pubsub.publish(SOMETHING_CHANGED_TOPIC, sampleData).then(() => {
        iterator.next().then(result => {
          // tslint:disable-next-line:no-unused-expression
          expect(result).to.exist;
          // tslint:disable-next-line:no-unused-expression
          expect(result.value).to.exist;
          // tslint:disable-next-line:no-unused-expression
          expect(result.value['data']).to.equals(sampleData.data);
          // tslint:disable-next-line:no-unused-expression
          expect(result.done).to.exist;
          // tslint:disable-next-line:no-unused-expression
          expect(iterator.return()).to.eventually.be.fulfilled;
          done();
        }).catch(fail);
      });
    }, 600);
  });

  it('Test wildcard subscribe', (done) => {
    const SOMETHING_CHANGED_TOPIC = 'wildcard_changed/';

    // Asserts here
    let callback = (message) => {
      assert(message, 'Message published');
      expect(message.data).to.equals(sampleData.data);
      done();
    };
    pubsub.subscribe(SOMETHING_CHANGED_TOPIC + '+', callback).then(() => {
      pubsub.publish(SOMETHING_CHANGED_TOPIC + 'data', sampleData);
    });
  });
});
