/**
 * @module config/sandbox
 */
'use strict';

const config = (module.exports = {});

config.nonBlockingModeNetworkAvailability = '';
config.nonBlockingModeConversionAvailability = '';
config.conversionAvailabilityTime = 0;

config.expressApi = {
  bind: '',
  port: 0,
  authorizationToken: '}',
};

config.proxy = {
  protocol: '',
  host: '',
  port: '',
  user: '',
  password: '',
};

config.checkAvailabilityOptions = {
  responseTimeout: 0, //ms
};

config.sentry = {
  dsn: '',
};

config.mysqlRead = {
  connection: {
    host: '',
    port: 0,
    database: '',
    user: '',
    password: '',
  },
};

config.mysqlWrite = {
  connection: {
    host: '',
    port: 0,
    database: '',
    user: '',
    password: '',
  },
};
