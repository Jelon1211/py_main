import {CanonicalProduct, ProductAdapter} from "../../base/interfaces";
import {PrestaProduct} from "../interfaces";

export class PrestaAdapter implements ProductAdapter<PrestaProduct, CanonicalProduct> {
    public fromPlatformFormat(product: PrestaProduct): CanonicalProduct {
        return {
            product_id: product.product_id,
            product_name: product.product_name,
            product_slug: product.product_slug,
            date_created: product.date_created,
            date_modified: product.date_modified,
            status: product.status,
            description: product.description,
            short_description: product.short_description,
            sku: product.sku,
            price: product.price.toString(),
            regular_price: product.regular_price.toString(),
            sale_price: product.sale_price.toString(),
            stock_quantity: product.stock_quantity,
            stock_status: product.stock_status,
            oss: product.oss,
            tax: product.tax,
            quantity: product.quantity,
            main_image_url: product.main_image_url,
            gallery_image_urls: product.gallery_image_urls,
            variations: product.variations,
            categories: product.categories
        };
    }

    public toPlatformFormat(product: CanonicalProduct): PrestaProduct {
        return {
            product_id: product.product_id,
            product_name: product.product_name,
            product_slug: product.product_slug,
            date_created: new Date(product.date_created).toISOString(),
            date_modified: new Date(product.date_modified).toISOString(),
            status: product.status,
            description: product.description,
            short_description: product.short_description,
            sku: product.sku,
            price: product.price,
            regular_price: product.regular_price,
            sale_price: product.sale_price,
            stock_quantity: product.stock_quantity,
            stock_status: product.stock_status,
            oss: product.oss,
            tax: product.tax,
            quantity: product.quantity,
            main_image_url: product.main_image_url,
            gallery_image_urls: product.gallery_image_urls,
            variations: product.variations,
            categories: product.categories
        };
    }
}
