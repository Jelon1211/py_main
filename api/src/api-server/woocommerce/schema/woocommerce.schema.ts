export const woocommerceCategorySchema = {
    type: 'object',
    properties: {
        name: {type: 'string'},
        subcategories: {
            type: 'array',
            items: {$ref: '#/definitions/category'}
        }
    },
    required: ['name'],
    additionalProperties: false
};

export const woocommerceProductSchema = {
    type: 'object',
    properties: {
        product_id: {type: 'integer'},
        product_name: {type: 'string'},
        product_slug: {type: 'string'},
        date_created: {type: 'string'},
        date_modified: {type: 'string'},
        status: {
            type: 'string',
            enum: ['publish', 'draft', 'pending']
        },
        description: {type: 'string'},
        short_description: {type: 'string'},
        sku: {type: 'string'},
        price: {type: 'string'},
        regular_price: {type: 'string'},
        sale_price: {type: 'string'},
        stock_quantity: {type: ['integer', 'null']},
        stock_status: {
            type: 'string',
            enum: ['instock', 'outofstock', 'onbackorder']
        },
        oss: {type: ['string', 'null']},
        tax: {type: ['string', 'null']},
        quantity: {type: ['integer', 'null']},
        main_image_url: {
            type: ['string', 'null'],
            format: 'uri'
        },
        gallery_image_urls: {
            type: 'array',
            items: {type: 'string'}
        },
        variations: {
            type: ['array', 'null'],
            items: {
                type: 'object'
            }
        },
        categories: {
            type: 'array',
            items: {$ref: '#/definitions/category'}
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
        category: woocommerceCategorySchema
    }
};

export const woocommerceOrderSchema = {
    type: 'object',
    properties: {
        order_id: {
            type: 'integer',
        },
        contractor: {
            type: 'object',
            properties: {
                customer_id: {type: 'integer'},
                first_name: {type: 'string'},
                last_name: {type: 'string'},
                email: {type: 'string', format: 'email'},
                phone: {type: 'string'},
                address: {type: 'string'},
            },
            additionalProperties: false,
        },
        product: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    product_id: {type: 'integer'},
                    product_name: {type: 'string'},
                    product_slug: {type: 'string'},
                    date_created: {type: 'string'},
                    date_modified: {type: 'string'},
                    status: {
                        type: 'string',
                        enum: ['publish', 'draft', 'pending'],
                    },
                    description: {type: 'string'},
                    short_description: {type: 'string'},
                    sku: {type: 'string'},
                    price: {type: 'string'},
                    regular_price: {type: 'string'},
                    sale_price: {type: ['string', 'null']},
                    stock_quantity: {type: ['integer', 'null']},
                    stock_status: {
                        type: 'string',
                        enum: ['instock', 'outofstock', 'onbackorder'],
                    },
                    oss: {type: ['string', 'null']},
                    tax: {type: ['string', 'null']},
                    quantity: {type: 'integer'},
                    main_image_url: {
                        type: ['string', 'null'],
                        format: 'uri',
                    },
                    gallery_image_urls: {
                        type: 'array',
                        items: {type: 'string'},
                    },
                    variations: {
                        type: ['array', 'null'],
                        items: {
                            type: 'object',
                        },
                    },
                    categories: {
                        type: 'array',
                        items: {$ref: '#/definitions/category'},
                    },
                },
                additionalProperties: false,
            },
        },
        amount: {
            type: 'object',
            properties: {
                order_total: {type: 'string'},
                paid_total: {type: 'number'},
                total_refunded: {type: 'number'},
                order_currency: {type: 'string'},
                paid_date: {type: ['null', 'string']},
            },
            additionalProperties: false,
        },
        payment_method: {
            type: 'object',
            properties: {
                payment_method: {type: 'string'},
                payment_method_title: {type: 'string'},
            },
            additionalProperties: false,
        },
        shipping: {
            type: 'object',
            properties: {
                address: {
                    type: 'object',
                    properties: {
                        first_name: {type: 'string'},
                        last_name: {type: 'string'},
                        company: {type: 'string'},
                        address_1: {type: 'string'},
                        address_2: {type: 'string'},
                        city: {type: 'string'},
                        state: {type: 'string'},
                        postcode: {type: 'string'},
                        country: {type: 'string'},
                    },
                    additionalProperties: false,
                },
                method: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            method_id: {type: 'string'},
                            method_title: {type: 'string'},
                            cost: {type: 'string'},
                            taxes: {
                                type: 'object',
                                properties: {
                                    total: {
                                        type: 'array',
                                        items: {type: 'number'},
                                    },
                                },
                                additionalProperties: false,
                            },
                        },
                    },
                },
                total: {
                    type: 'object',
                    properties: {
                        shipping_total: {type: 'string'},
                        shipping_tax: {type: 'string'},
                    },
                    additionalProperties: false,
                },
            },
            additionalProperties: false,
        },
    },
    required: ['order_id'],
    additionalProperties: false,
    definitions: {
        category: {
            type: 'object',
            properties: {
                name: {type: 'string'},
                subcategories: {
                    type: 'array',
                    items: {$ref: '#/definitions/category'},
                },
            },
            required: ['name'],
            additionalProperties: false,
        },
    },
};