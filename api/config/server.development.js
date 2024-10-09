/**
 * @module config/development
 */
'use strict';

const config = (module.exports = {});

config.nonBlockingModeNetworkAvailability = true; // true for dev
config.nonBlockingModeConversionAvailability = false; // false for dev
config.conversionAvailabilityTime = 60; // sec

config.expressApi = {
  bind: '127.0.0.1',
  port: 8000,
  authorizationToken: 'dev-authorization-token',
};

config.proxy = {
  protocol: 'http',
  host: '',
  port: '8080',
  user: 'root',
  password: 'password',
};

config.sentry = {
  dsn: '',
};

config.mysqlRead = {
  connection: {
    host: 'db',
    port: 3306,
    database: 'scrap_db',
    user: 'root',
    password: 'password',
  },
};

config.mysqlWrite = {
  connection: {
    host: 'db',
    port: 3306,
    database: 'scrap_db',
    user: 'root',
    password: 'password',
  },
};
