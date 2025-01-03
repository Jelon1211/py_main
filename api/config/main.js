const config = module.exports = {};

config.application = 'ebiuro-api-portal';

config.expressApi = {
	bind:               '',
	port:               null,
	authorizationToken: '',
};

config.luxon = {
	timezone: 'Europe/Warsaw',
};

config.winston = {
	console:     {
		level:            'info',
		handleExceptions: true,
		json:             false,
		colorize:         false,
	},
	sentry:      {
		level: 'error',
	},
	transports:  {
		console: {
			enabled: true
		},
		sentry:  {
			enabled: true
		}
	},
	exitOnError: false
};

config.sentry = {
	tracing:     {
		enabled:                   true,
		tracesSampleRate:          1,
		stripedTransactionTagList: [],
		skipTransactionEventList:  [
			'GET /v1/check/ping',
			'GET /v1/check/telemetry'
		],
	},
	dsn:         '',
	environment: process.env.NODE_ENV,
	release:     process.env.APP_VERSION_NUMBER,
}

config.mysqlRead = {
	id:         'READ',
	connection: {
		connectionLimit: 10,
		host:            '',
		timezone:        'Europe/Warsaw',
		port:            null,
		database:        '',
		user:            '',
		password:        '',
		charset:         'UTF8_GENERAL_CI',
	}
};

config.mysqlWrite = {
	id:         'WRITE',
	connection: {
		connectionLimit: 10,
		host:            '',
		timezone:        'Europe/Warsaw',
		port:            null,
		database:        '',
		user:            '',
		password:        '',
		charset:         'UTF8_GENERAL_CI'
	}
};

config.cron = {
	cronTimeSyncApiloProducts: '',
};

config.baselinker = {
	apiUrl: '',
};

config.apilo = {
	crypto: '',
};

config.jwt = {
	secret: ''
}

config.ebiuroProxy = {
	apiToken: '',
	apiUrl:   '',
};

config.paymentoProxy = {}

module.exports = config;
