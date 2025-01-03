import {CanonicalCategory, CanonicalProduct, ProductAdapter} from "../../base/interfaces";
import {ApiloProductDetails, ApiloProductPost} from "../interfaces";

export class ApiloAdapter implements ProductAdapter<ApiloProductDetails, CanonicalProduct> {
    public fromPlatformFormat(product: ApiloProductDetails): CanonicalProduct {
        return {
            product_id: product.id,
            product_name: product.name ?? '',
            product_slug: this.generateSlug(product.name ?? ''),
            date_created: new Date().toISOString(),
            date_modified: new Date().toISOString(),
            status: String(product.status ?? 0),
            description: '',
            short_description: '',
            sku: product.sku ?? '',
            price: product.priceWithoutTax ?? '0',
            regular_price: product.priceWithoutTax ?? '0',
            sale_price: product.priceWithTax?.toString() ?? '0',
            stock_quantity: product.quantity ?? null,
            stock_status: this.mapStockStatus(product.quantity ?? 0),
            oss: null,
            tax: product.tax ?? '0',
            quantity: product.quantity ?? 0,
            main_image_url: null,
            gallery_image_urls: null,
            variations: null,
            categories: this.mapCategories(product.categories ?? []),
        };
    }

    public toPlatformFormat(product: CanonicalProduct): ApiloProductPost {
        return {
            sku: product.sku && product.sku.trim() !== '' ? product.sku : String(product.product_id),
            name: product.product_name,
            tax: product.tax,
            status: this.mapStatusToNumber(product.status),
            originalCode: product.product_slug,
            groupName: this.getGroupNameFromCategories(product.categories),
            // eslint-disable-next-line no-warning-comments
            // TODO: handle attributes somehow
            attributes: {},
            images: this.mapImages(product),
            ean: '',
            quantity: Number(product.quantity) || 0,
            priceWithTax: Number(product.price),
            weight: 0,
            unit: 'KG',
            description: product.description ?? '',
            shortDescription: product.short_description ?? '',
        };
    }

    private mapStatusToNumber(status: string): number {
        switch (status.toLowerCase()) {
            case 'active':
                return 1;
            case 'inactive':
                return 0;
            case 'archive':
                return 8;
            default:
                return 0;
        }
    }

    private getGroupNameFromCategories(categories: CanonicalCategory[]): string {
        return categories.length > 0 ? categories[0].name : 'Default Group';
    }

    private extractAttributes(product: CanonicalProduct): Record<string, string | number> {
        return {
            stock_status: product.stock_status,
        };
    }

    private mapImages(product: CanonicalProduct): Record<string, string> {
        const images: Record<string, string> = {};
        if (product.main_image_url) {
            images['main'] = product.main_image_url;
        }
        if (product.gallery_image_urls) {
            product.gallery_image_urls.forEach((url, index) => {
                images[`gallery_${index + 1}`] = url;
            });
        }
        return images;
    }

    private generateSlug(name: string | null): string {
        return name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '';
    }

    private mapStockStatus(quantity: number): string {
        return quantity > 0 ? 'in_stock' : 'out_of_stock';
    }

    private mapCategories(categories: number[]): CanonicalCategory[] {
        return categories.map((categoryId) => ({id: categoryId, name: `Category ${categoryId}`}));
    }
}
