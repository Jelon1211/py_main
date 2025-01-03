export const createIntegrationSchema = {
    type: 'object',
    properties: {
        platform: {
            type: 'string',
            enum: ['WooCommerce', 'PrestaShop', 'Apilo', 'BaseLinker'],
            minLength: 1
        },
        integrationName: {
            type: 'string',
            minLength: 1
        },
        siteUrl: {
            type: ['string', 'null'],
            minLength: 1
        },
        xblToken: {
            type: ['string'],
            minLength: 1
        }
    },
    additionalProperties: false,
    required: ['platform', 'integrationName', 'siteUrl']
};

export const putIntegrationSchema = {
    type: 'object',
    properties: {
        uuid: {
            type: 'string',
            minLength: 1
        },
        integrationName: {
            type: 'string',
            minLength: 1
        },
        platform: {
            type: 'string',
            enum: ['WooCommerce', 'PrestaShop', 'Apilo', 'BaseLinker'],
            minLength: 1
        },
        siteUrl: {
            type: ['string', 'null'],
            minLength: 1,
        },
        xblToken: {
            type: ['string'],
            minLength: 1,
        },
        status: {
            type: ['string', 'null'],
            minLength: 1
        },
        isDeleted: {
            type: ['number', 'null'],
            minimum: 0
        },
        invoiceStatusTrigger: {
            type: ['string', 'null'],
            minLength: 1
        },
        invoiceNumbering: {
            type: ['string', 'null'],
            minLength: 1
        },
        receiptNumbering: {
            type: ['string', 'null'],
            minLength: 1
        },
        warehouse: {
            type: ['string', 'null'],
            minLength: 1
        },
        productGroup: {
            type: ['string', 'null'],
            minLength: 1
        },
        priceGroup: {
            type: ['string', 'null'],
            minLength: 1
        },
        syncDirection: {
            type: ['string', 'null'],
            enum: ['from_ebiuro', 'from_integration'],
            minLength: 1
        },
        inventorySync: {
            type: ['string', 'null']
        }
    },
    additionalProperties: false,
    required: ['uuid', 'integrationName', 'platform', 'siteUrl'],
};

export const patchIntegrationSchema = {
    type: 'object',
    properties: {
        uuid: {
            type: 'string',
            minLength: 1
        },
        status: {
            type: ['string'],
            enum: ['activate', 'deactivate'],
        }
    },
    additionalProperties: false,
    required: ['uuid', 'status'],
};

export const deleteIntegrationSchema = {
    type: 'object',
    properties: {
        uuid: {
            type: 'string',
            minLength: 1
        },
    },
    additionalProperties: false,
    required: ['uuid'],
};
export const checkIntegrationSchema = {
    type: 'object',
    properties: {
        uuid: {
            type: 'string',
            minLength: 1
        },
        platform: {
            type: 'string',
            enum: ['WooCommerce', 'PrestaShop'],
            minLength: 1
        },
        siteUrl: {
            type: ['string', 'null'],
            minLength: 1,
        },
    },
    additionalProperties: false,
    required: ['uuid', 'platform', 'siteUrl'],
};

export const initBaseLinkerIntegrationSchema = {
    type: 'object',
    properties: {
        uuid: {
            type: 'string',
            minLength: 1
        },
        platform: {
            type: 'string',
            enum: ['BaseLinker'],
            minLength: 1
        },
        xblToken: {
            type: ['string'],
            minLength: 1,
        },
    },
    additionalProperties: false,
    required: ['uuid', 'platform', 'xblToken'],
};

export const initApiloIntegrationSchema = {
    type: 'object',
    properties: {
        uuid: {
            type: 'string',
            minLength: 1
        },
        apiEndpoint: {
            type: 'string',
            minLength: 1
        },
        clientId: {
            type: ['number'],
            minLength: 1,
        },
        clientSecret: {
            type: ['string'],
            minLength: 1,
        },
        authCode: {
            type: ['string'],
            minLength: 1,
        },
    },
    additionalProperties: false,
    required: ['uuid', 'apiEndpoint', 'clientId', 'clientSecret', 'authCode'],
};
