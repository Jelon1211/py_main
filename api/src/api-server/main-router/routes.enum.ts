export enum IntegrationRoutes {
	INTEGRATION = '/integration',
	CHECK = '/check'
}

export enum WoocommerceRoutes {
	WOOCOMMERCE = '/woocommerce',
	V1 = '/v1/ebiuro_api_portal',
	BASE = '/wp-json',
	INTEGRATION = '/integration',
	PRODUCT = '/product'
}

export enum PrestaRoutes {
	PRESTA = '/presta',
	V1 = '/v1/ebiuro_api_portal',
	INTEGRATION = '/integration',
	PRODUCT = '/product'
}

export enum BaseLinkerRoutes {
	BASELINKER = '/baselinker',
	INIT = '/init',
}
export enum ApiloRoutes {
	APILO = '/apilo',
	INIT = '/init',
}

export enum EbiuroProxyRoutes {
	EBIUROPROXY = '/ebiuroproxy',
	PRODUCT = '/product'
}

export enum ProxyRoutes {
	ORDER = '/order'
}

export enum OpenRoutes {
	PRODUCT = '/product',
	ORDER = '/order',
	SYNC = '/sync',
	INTEGRATIONKEY = '/:integrationKey'
}

export enum Routes {
	V1 = '/v1',
	CHECK = '/check',
	PING = '/ping',
	TELEMETRY = '/telemetry',
	INTEGRATION = '/integration',
	BASELINKER = '/baselinker',
	APILO = '/apilo',
}