import {StatusHttp} from "../integration/enums";

export interface ProxyOrderResponse {
    status: StatusHttp,
    orderId: number,
}

export interface EbiuroProxyProduct {
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
    tax: string | number;
    quantity: string | number | null;
    main_image_url: string | null;
    gallery_image_urls: string[] | null;
    variations: string[] | null;
}

export interface DeleteProductRequest {
    productId: string;
}
