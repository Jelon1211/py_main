export interface WoocommerceCategory {
    name: string;
    subcategories?: WoocommerceCategory[];
}

export interface WoocommerceProduct {
    product_id: number;
    product_name: string;
    product_slug: string;
    date_created: string;
    date_modified: string;
    status: string;
    description: string;
    short_description: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    stock_quantity: number | null;
    stock_status: string;
    oss: string | number | null;
    tax: string | number | null;
    quantity: string | number | null;
    main_image_url: string | null;
    gallery_image_urls: string[] | null;
    variations: string[] | null;
    categories: WoocommerceCategory[];
}


export interface MappedProducts {
    products: WoocommerceProduct[];
}

export interface MappedDeletionProductsId {
    products: { productId: string }[];
}

export interface WoocommerceOrder {
    order_id: number,
    contractor?: Contractor;
    product?: WoocommerceProduct[];
    amount?: Amount;
    payment_method?: PaymentMethod;
    shipping?: Shipping;
}

export interface Contractor {
    customer_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address: string;
}

export interface Amount {
    order_total: string;
    paid_total: number;
    total_refunded: number;
    order_currency: string;
    paid_date?: string | null;
}

export interface PaymentMethod {
    payment_method: string;
    payment_method_title: string;
}

export interface Shipping {
    address: Address;
    method: ShippingMethod[];
    total: ShippingTotal;
}

export interface Address {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
}

export interface ShippingMethod {
    method_id: string;
    method_title: string;
    cost: string;
    taxes: {
        total: number[];
    };
}

export interface ShippingTotal {
    shipping_total: string;
    shipping_tax: string;
}