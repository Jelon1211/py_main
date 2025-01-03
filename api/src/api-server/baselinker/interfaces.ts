import {BaseLinkerStatusResponse} from "./enums";
import {StatusHttp} from "../integration/enums";

export interface BaselinkerTokenPayload {
    uuid: string,
    xblToken: string,
}

export interface BaselinkerTokenRecord {
    token_uuid: string
}

export interface GetInventoriesResponse {
    status: BaseLinkerStatusResponse;
    inventories: Inventory[];
}

interface Inventory {
    inventory_id: number;
    name: string;
    description: string;
    languages: string[];
    default_language: string;
    price_groups: number[];
    default_price_group: number;
    warehouses: string[];
    default_warehouse: string;
    reservations: boolean;
    is_default: boolean;
}

export interface BaselinkerGetStoragesList {
    status: string;
    storages: Storage[];
}

interface Storage {
    storage_id: string;
    name: string;
    methods: string[];
    read: boolean;
    write: boolean;
}

export interface ProductsResponse {
    status: StatusHttp;
    storage_id: string;
    products: Record<string, BaselinkerProduct>;
}

export interface BaselinkerProduct {
    product_id: number,
    ean: string,
    sku: string,
    name: string,
    quantity: number | string,
    price_netto: number,
    price_brutto: number | string,
    price_wholesale_netto: number | string,
    tax_rate: number,
    weight: number,
    man_name: string,
    man_image: string | null,
    category_id: number,
    images: string[],
    features: unknown[],
    variants: unknown[],
    description: string | null,
    description_extra1: string | null,
    description_extra2: string | null,
    description_extra3: string | null,
    description_extra4: string | null,
}

export interface BaselinkerInventory {
    inventory_id: number;
    products: Record<string, BaselinkerProduct>;
}

export interface GetInventoryProductsListResponse {
    products: Record<string, { name: string; sku: string; ean: string }>;
}

export interface GetInventoryProductsDataResponse {
    status: string;
    products: Record<string, BaselinkerProduct>;
}

export interface BaselinkerGetCategoriesResponse {
    status: string;
    storage_id: string;
    categories: BaselinkerCategory[];
}

export interface BaselinkerCategory {
    category_id: number;
    name: string;
    parent_id: number;
}

export interface BaselinkerProductsDict {
    [key: string]: boolean;
}

export interface BaselinkerProductAddResponse {
    status: BaseLinkerStatusResponse,
    storage_id: string,
    product_id: number,
}

export interface GetBaselinkerOrdersResponse {
    status: StatusHttp,
    orders: BaselinkerOrder[],
}
export interface DeleteBaselinkerProduct {
    status: BaseLinkerStatusResponse
}

interface BaselinkerOrder {
    order_id: number;
    shop_order_id: number;
    external_order_id: string;
    order_source: string;
    order_source_id: number;
    order_source_info: string;
    order_status_id: number;
    date_add: number;
    date_confirmed?: number;
    date_in_status: number;
    user_login: string;
    phone: string;
    email: string;
    user_comments?: string;
    admin_comments?: string;
    currency: string;
    payment_method: string;
    payment_method_cod: string;
    payment_done: string;
    delivery_method: string;
    delivery_price: number;
    delivery_package_module: string;
    delivery_package_nr?: string;
    delivery_fullname: string;
    delivery_company?: string;
    delivery_address: string;
    delivery_city: string;
    delivery_state?: string;
    delivery_postcode: string;
    delivery_country: string;
    delivery_point_id?: string;
    delivery_point_name?: string;
    delivery_point_address?: string;
    delivery_point_postcode?: string;
    delivery_point_city?: string;
    invoice_fullname: string;
    invoice_company?: string;
    invoice_nip?: string;
    invoice_address: string;
    invoice_city: string;
    invoice_state?: string;
    invoice_postcode: string;
    invoice_country: string;
    want_invoice: string;
    extra_field_1?: string;
    extra_field_2?: string;
    custom_extra_fields?: Record<string, string>;
    order_page: string;
    pick_status: string;
    pack_status: string;
    products: BaselinkerOrderProduct[];
}

interface BaselinkerOrderProduct {
    storage: string;
    storage_id: number;
    order_product_id: number;
    product_id: string;
    variant_id?: number;
    name: string;
    attributes?: string;
    sku: string;
    ean: string;
    location?: string;
    auction_id: string;
    price_brutto: number;
    tax_rate: number;
    quantity: number;
    weight: number;
    bundle_id: number;
}