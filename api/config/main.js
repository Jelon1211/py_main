const config = (module.exports = {});

config.application = '';
config.applicationKey = '';
config.nonBlockingModeNetworkAvailability = true;
config.nonBlockingModeConversionAvailability = true;
config.conversionAvailabilityTime = 120; // sec

config.expressApi = {
  bind: '',
  port: null,
  authorizationToken: '',
};

config.proxy = {
  protocol: null,
  host: null,
  port: null,
  user: null,
  password: null,
};

config.luxon = {
  timezone: 'Europe/Warsaw',
};

config.checkAvailabilityOptions = {
  responseTimeout: 5000, //ms
};

config.winston = {
  console: {
    level: 'info',
    handleExceptions: true,
    json: false,
    colorize: false,
  },
  sentry: {
    level: 'error',
  },
  transports: {
    console: {
      enabled: true,
    },
    sentry: {
      enabled: true,
    },
  },
  exitOnError: false,
};

config.sentry = {
  tracing: {
    enabled: true,
    tracesSampleRate: 1,
    stripedTransactionTagList: [],
    skipTransactionEventList: ['GET /v1/check/ping', 'GET /v1/check/telemetry'],
  },
  dsn: '',
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION_NUMBER,
};

config.mysqlRead = {
  id: 'READ',
  connection: {
    connectionLimit: 1,
    host: '',
    timezone: '+02:00',
    port: null,
    database: '',
    user: '',
    password: '',
    charset: 'UTF8_GENERAL_CI',
  },
  reconnectPeriod: 5000,
};

config.mysqlWrite = {
  id: 'WRITE',
  connection: {
    connectionLimit: 1,
    host: '',
    timezone: '+02:00',
    port: null,
    database: '',
    user: '',
    password: '',
    charset: 'UTF8_GENERAL_CI',
  },
  reconnectPeriod: 5000,
};

module.exports = config;
