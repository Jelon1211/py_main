/**
 * @module config/production
 */
'use strict';

const config = module.exports = {};

config.expressApi = {
	bind:               '{{ app_quota_check_api_bind_address }}',
	port:               Number('{{ app_quota_check_api_bind_port }}'),
	authorizationToken: '{{ app_quota_check_authorization_token }}'
};

config.winston = {};

config.sentry = {
	dsn: '{{ app_quota_check_sentry_dsn }}'
}

config.rabbitMQ = {
	connection:       [
		{
			hostname: '{{ app_quota_check_mqtt_hostname_first }}',
			port:     Number('{{ app_quota_check_mqtt_port_first }}'),
			username: '{{ app_quota_check_mqtt_user_first }}',
			password: '{{ app_quota_check_mqtt_password_first }}',
			vhost:    '{{ app_quota_check_mqtt_vhost_first }}'
		},
		{
			hostname: '{{ app_quota_check_mqtt_hostname_second }}',
			port:     Number('{{ app_quota_check_mqtt_port_second }}'),
			username: '{{ app_quota_check_mqtt_user_second }}',
			password: '{{ app_quota_check_mqtt_password_second }}',
			vhost:    '{{ app_quota_check_mqtt_vhost_second }}'
		}
	],
	consumerPrefetch: Number('{{ app_quota_check_mqtt_consumer_prefetch }}'),
};

config.mysqlRead = {
	connection: {
		connectionLimit: Number('{{ app_quota_check_mysql_read_connection_limit }}'),
		host:            '{{ app_quota_check_mysql_read_host }}',
		port:            Number('{{ app_quota_check_mysql_read_port }}'),
		database:        '{{ app_quota_check_mysql_read_database }}',
		user:            '{{ app_quota_check_mysql_read_user }}',
		password:        '{{ app_quota_check_mysql_read_password }}'
	}
};

config.mysqlWrite = {
	connection: {
		connectionLimit: Number('{{ app_quota_check_mysql_write_connection_limit }}'),
		host:            '{{ app_quota_check_mysql_write_host }}',
		port:            Number('{{ app_quota_check_mysql_write_port }}'),
		database:        '{{ app_quota_check_mysql_write_database }}',
		user:            '{{ app_quota_check_mysql_write_user }}',
		password:        '{{ app_quota_check_mysql_write_password }}'
	}
};

config.notificationConsumer = {
	address: '{{ app_quota_check_notify_address }}', //BEZ  '/v1/... ...' NP. https://0.0.0.0:7777
	route:   '{{ app_quota_check_notify_route }}',
	alg:     '{{ app_quota_check_notify_alg }}',
	token:   '{{ app_quota_check_notify_token }}'
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