import {StatusHttp, SupportedPlatforms} from "../integration/enums";
import {Integration} from "../integration/interfaces";

export interface PropagateProductResponse {
    status: StatusHttp
    data: {
        integrationUuid: string,
        platform: SupportedPlatforms,
        siteUrl: string,
    }
}

export interface PropagationObject {
    integrations: Integration[] | [],
    canonicalProduct: CanonicalProduct,
}

export interface DeletionObject {
    integrations: Integration[] | [],
    productId: string,
}

export interface CanonicalCategory {
    name: string;
    subcategories?: CanonicalCategory[];
}

export interface CanonicalProduct {
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
    categories: CanonicalCategory[];
}

export interface PropagatorProductResponse {
    platform: string,
    name: string,
    status: StatusHttp,
    error?: string
}

export interface ProductAdapter<TPlatformProduct, TCanonicalProduct> {
    fromPlatformFormat(product: TPlatformProduct): TCanonicalProduct;
    toPlatformFormat(product: TCanonicalProduct): TPlatformProduct;
}

export interface PlatformService {
    getPlatform(): SupportedPlatforms;
    pushProduct(integration: Integration, canonicalProduct: CanonicalProduct): Promise<void>;
    deleteProduct(integration: Integration, productId: string): Promise<void>;
}