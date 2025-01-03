export const ebiuroProxyProductSchema = {
    type: 'object',
    properties: {
        status: {
            type: 'string',
            enum: ['SUCCESS', 'ERROR']
        },
        inventories: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    inventory_id: {
                        type: 'integer'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    languages: {
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    default_language: {
                        type: 'string'
                    },
                    price_groups: {
                        type: 'array',
                        items: {
                            type: 'integer'
                        }
                    },
                    default_price_group: {
                        type: 'integer'
                    },
                    warehouses: {
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    default_warehouse: {
                        type: 'string'
                    },
                    reservations: {
                        type: 'boolean'
                    },
                    is_default: {
                        type: 'boolean'
                    }
                },
                required: [
                    'inventory_id',
                    'name',
                    'description',
                    'languages',
                    'default_language',
                    'price_groups',
                    'default_price_group',
                    'warehouses',
                    'default_warehouse',
                    'reservations',
                    'is_default'
                ],
                additionalProperties: false
            }
        }
    },
    required: ['status', 'inventories'],
    additionalProperties: false
};

export const ebiuroProxyDeleteProductSchema = {
    type: 'object',
    properties: {
        productId: {
            type: 'string'
        },
    },
    required: ['productId'],
    additionalProperties: false
};