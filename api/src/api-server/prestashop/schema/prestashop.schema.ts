export const prestaProductSchema = {
    type: 'object',
    properties: {
        product_id: {
            type: 'integer'
        },
        product_name: {
            type: 'string'
        },
        product_slug: {
            type: 'string'
        },
        date_created: {
            type: 'string',
        },
        date_modified: {
            type: 'string',
        },
        status: {
            type: 'string',
            enum: ['publish', 'draft', 'inactive']
        },
        description: {
            type: 'string'
        },
        short_description: {
            type: 'string'
        },
        sku: {
            type: 'string'
        },
        price: {
            type: 'string'
        },
        regular_price: {
            type: 'string'
        },
        sale_price: {
            type: 'string'
        },
        stock_quantity: {
            type: ['integer', 'null']
        },
        stock_status: {
            type: 'string',
            enum: ['instock', 'outofstock']
        },
        oss: {
            type: ['number', 'null']
        },
        tax: {
            type: ['number', 'null']
        },
        quantity: {
            type: ['number', 'null']
        },
        main_image_url: {
            type: ['string', 'null'],
            format: 'uri'
        },
        gallery_image_urls: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        categories: {
            type: 'array',
            items: {
                $ref: '#/definitions/category'
            }
        },
        variations: {
            type: ['array', 'null'],
            items: {
                type: 'object'
            }
        }
    },
    required: [
        'product_id',
        'product_name',
        'product_slug',
        'date_created',
        'date_modified',
        'status',
        'description',
        'price',
        'regular_price',
        'stock_status',
        'categories'
    ],
    additionalProperties: false,
    definitions: {
        category: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                subcategories: {
                    type: 'array',
                    items: { $ref: '#/definitions/category' }
                }
            },
            required: ['name'],
            additionalProperties: false
        }
    }
};
