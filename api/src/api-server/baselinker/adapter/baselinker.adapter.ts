import {CanonicalProduct, ProductAdapter} from "../../base/interfaces";
import {BaselinkerProduct} from "../interfaces";

export class BaselinkerAdapter implements ProductAdapter<BaselinkerProduct, CanonicalProduct> {
    public fromPlatformFormat(product: BaselinkerProduct): CanonicalProduct {
        return {
            product_id: product.product_id,
            product_name: product.name,
            product_slug: this.generateSlug(product.name),
            date_created: new Date().toISOString(),
            date_modified: new Date().toISOString(),
            status: "active",
            description: product.description || "",
            short_description: product.description_extra1 || "",
            sku: product.sku,
            price: product.price_brutto.toString(),
            regular_price: product.price_netto.toString(),
            sale_price: product.price_wholesale_netto.toString(),
            stock_quantity: typeof product.quantity === "string" ? parseInt(product.quantity) : product.quantity,
            stock_status: product.quantity > 0 ? "in_stock" : "out_of_stock",
            oss: null,
            tax: product.tax_rate,
            quantity: product.quantity,
            main_image_url: product.images.length > 0 ? product.images[0] : null,
            gallery_image_urls: product.images.slice(1),
            variations: product.variants ? product.variants.map((v) => JSON.stringify(v)) : [],
            categories: [],
        };
    }

    public toPlatformFormat(product: CanonicalProduct): BaselinkerProduct {
        return {
            product_id: product.product_id,
            ean: "",
            sku: product.sku,
            name: product.product_name,
            quantity: product.stock_quantity !== null ? product.stock_quantity : 0,
            price_netto: parseFloat(product.price) || 0,
            price_brutto: parseFloat(product.regular_price) || 0,
            price_wholesale_netto: product.sale_price ? parseFloat(product.sale_price) : 0,
            tax_rate: typeof product.tax === "string" ? parseFloat(product.tax) : product.tax || 0,
            weight: 0,
            man_name: "",
            man_image: null,
            category_id: 0,
            // eslint-disable-next-line multiline-ternary
            images: product.gallery_image_urls && product.main_image_url
                // eslint-disable-next-line multiline-ternary
                ? [product.main_image_url, ...product.gallery_image_urls].filter((url) => !!url)
                : [],
            features: [],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            variants: product.variations ? product.variations.map((v) => JSON.parse(v)) : [],
            description: product.description || "",
            description_extra1: product.short_description || null,
            description_extra2: null,
            description_extra3: null,
            description_extra4: null,
        };
    }

    private generateSlug(name: string): string {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
}