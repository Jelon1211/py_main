import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {Integration} from "../../integration/interfaces";
import {WoocommerceException} from "../../../exceptions/woocommerce.exception";
import {MappedDeletionProductsId, MappedProducts, WoocommerceOrder, WoocommerceProduct} from "../interfaces";
import {CanonicalProduct, PlatformService, PropagationObject} from "../../base/interfaces";
import {SupportedPlatforms} from "../../integration/enums";
import {HttpMethod} from "../../base/http-method.enum";
import {WoocommerceRoutes} from "../../main-router/routes.enum";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {BaseService} from "../../base/service/base.service";
import {InfoLog} from "../../../loggers/info-log/info-log.instance";
import {WoocommerceModel} from "../../../data-sources/sql/models/woocommerce.model";
import {ProxyOrderResponse} from "../../ebiuro-proxy/intergace";

export class WoocommerceService implements PlatformService {
    private readonly baseService: BaseService = BaseService.getInstance();
    private readonly woocommerceModel: WoocommerceModel = WoocommerceModel.getInstance();
    private readonly logger: AppLogger = AppLogger.getInstance();


    public getPlatform(): SupportedPlatforms {
        return SupportedPlatforms.WOOCOMMERCE;
    }

    private async pushProduct(integration: Integration, canonicalProduct: CanonicalProduct): Promise<void> {
        try {
            const wooProduct: WoocommerceProduct = this.baseService.adapter.getAdapter<WoocommerceProduct>(SupportedPlatforms.WOOCOMMERCE).toPlatformFormat(canonicalProduct);
            const mappedProduct: MappedProducts = this.mapWooProductForPost(wooProduct);

            const wpResponse = await this.sendWooCommerceRequest(integration.integration_settings__site_url as string, WoocommerceRoutes.PRODUCT, integration.integration__uuid, mappedProduct);
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Woo product propagated successfully.', {wpResponse}));
        } catch (err) {
            const error = new WoocommerceException(
                'Error executing pushProduct function',
                ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
            throw error;
        }
    }

    public async deleteProduct(integration: Integration, productId: string): Promise<void> {
        try {
            const mappedProduct = this.mapWooProductForDelete(productId);

            const wpResponse = await this.sendWooCommerceRequest(integration.integration_settings__site_url as string, WoocommerceRoutes.PRODUCT, integration.integration__uuid, mappedProduct, HttpMethod.DELETE);
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Woo product deleted successfully.', {wpResponse}));
        } catch (err) {
            const error = new WoocommerceException(
                'Error executing deleteProduct function',
                ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
            throw error;
        }
    }

    public async getWoocommerceProductPropagateObject(integrationUuid: string, wooProduct: WoocommerceProduct): Promise<PropagationObject> {
        try {
            const canonicalProduct: CanonicalProduct = this.baseService.adapter.getAdapter(SupportedPlatforms.WOOCOMMERCE).fromPlatformFormat(wooProduct);

            const integrations: Integration[] | [] = await this.baseService.getAllActiveIntegrationsByIntegrationUuid(integrationUuid)

            return {
                integrations, canonicalProduct
            };

        } catch (err) {
            const error = new WoocommerceException('Error executing getWoocommerceProductPropagateObject function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async handleWoocommerceOrder(integrationUuid: string, wooOrder: WoocommerceOrder): Promise<ProxyOrderResponse | { orderUuid: string }> {
        try {
            const isOrderSaved = await this.woocommerceModel.checkOrderExists(integrationUuid, wooOrder.order_id);
            if (isOrderSaved) {
                return await this.baseService.sendOrderId(integrationUuid, wooOrder.order_id)
            }
            return await this.saveWoocommerceOrder(integrationUuid, wooOrder)
        } catch (err) {
            const error = new WoocommerceException('Error executing handleWoocommerceOrder function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async saveWoocommerceOrder(integrationUuid: string, wooOrder: WoocommerceOrder): Promise<{ orderUuid: string }> {
        try {
            const wooOrderJson = JSON.stringify(wooOrder);
            return await this.woocommerceModel.insertOrder(integrationUuid, wooOrderJson, wooOrder.order_id)
        } catch (err) {
            const error = new WoocommerceException('Error executing saveWoocommerceOrder function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private mapWooProductForPost(wooProduct: WoocommerceProduct): MappedProducts {
        return {products: [wooProduct]};
    }

    private mapWooProductForDelete(productId: string): MappedDeletionProductsId {
        return {
            products: [{
                productId
            }]
        };
    }

    public async sendWooCommerceRequest<T>(
        endpoint: string,
        route: string,
        integrationUuid: string,
        parameters: Record<string, unknown> = {},
        method: HttpMethod = HttpMethod.POST,
        query: string = '',
    ): Promise<T> {
        try {
            const url = new URL(`${endpoint}${WoocommerceRoutes.BASE}${WoocommerceRoutes.V1}${route}`);
            if (query) {
                const queryParams = new URLSearchParams(query);
                queryParams.forEach((value, key) => {
                    url.searchParams.append(key, value);
                });
            }

            const axiosConfig: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${integrationUuid}`,
                },
                params: method === HttpMethod.GET ? parameters : {},
            };

            const response: AxiosResponse<T> = method === HttpMethod.GET ? await axios.get(url.toString(), axiosConfig) : await axios.post(url.toString(), parameters, axiosConfig);

            return response.data;
        } catch (err) {
            const error = new WoocommerceException(
                'Error executing sendWooCommerceRequest function',
                ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
            throw error;
        }
    }

}
