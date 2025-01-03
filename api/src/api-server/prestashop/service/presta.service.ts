import {CanonicalProduct, PlatformService, PropagationObject} from "../../base/interfaces";
import {Integration} from "../../integration/interfaces";
import {SupportedPlatforms} from "../../integration/enums";
import {HttpMethod} from "../../base/http-method.enum";
import {PrestaRoutes} from "../../main-router/routes.enum";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {BaseService} from "../../base/service/base.service";
import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {PrestaException} from "../../../exceptions/presta.exception";
import {MappedDeletionProductsId, MappedProducts, PrestaProduct} from "../interfaces";
import {InfoLog} from "../../../loggers/info-log/info-log.instance";
import {WoocommerceOrder} from "../../woocommerce/interfaces";
import {ProxyOrderResponse} from "../../ebiuro-proxy/intergace";
import {PrestashopModel} from "../../../data-sources/sql/models/prestashop.model";

export class PrestaService implements PlatformService {
    private readonly baseService: BaseService = BaseService.getInstance();
    private readonly prestashopModel: PrestashopModel = PrestashopModel.getInstance();

    private readonly logger: AppLogger = AppLogger.getInstance();

    public getPlatform(): SupportedPlatforms {
        return SupportedPlatforms.PRESTASHOP;
    }

    private async pushProduct(integration: Integration, canonicalProduct: CanonicalProduct): Promise<void> {
        try {
            const prestaProduct: PrestaProduct = this.baseService.adapter.getAdapter<PrestaProduct>(SupportedPlatforms.PRESTASHOP).toPlatformFormat(canonicalProduct);
            const mappedProduct: MappedProducts = this.mapPrestaProductForPost(prestaProduct);

            const psResponse = await this.sendPrestaShopRequest(integration.integration_settings__site_url as string, PrestaRoutes.PRODUCT, integration.integration__uuid, mappedProduct);
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Woo product propagated successfully.', {psResponse}));
        } catch (err) {
            const error = new PrestaException(
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
            const mappedProduct = this.mapPrestaProductForDelete(productId);

            const psResponse = await this.sendPrestaShopRequest(integration.integration_settings__site_url as string, PrestaRoutes.PRODUCT, integration.integration__uuid, mappedProduct, HttpMethod.DELETE);
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Woo product propagated successfully.', {psResponse}));
        } catch (err) {
            const error = new PrestaException(
                'Error executing deleteProduct function',
                ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
            throw error;
        }
    }

    public async getPrestaProductPropagateObject(integrationUuid: string, prestaProduct: PrestaProduct): Promise<PropagationObject> {
        try {
            const canonicalProduct: CanonicalProduct = this.baseService.adapter.getAdapter(SupportedPlatforms.PRESTASHOP).fromPlatformFormat(prestaProduct);

            const integrations: Integration[] | [] = await this.baseService.getAllActiveIntegrationsByIntegrationUuid(integrationUuid)

            return {
                integrations, canonicalProduct
            };

        } catch (err) {
            const error = new PrestaException('Error executing getPrestaProductPropagateObject function', ExceptionCodeEnum.PRESTA_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async handlePrestaOrder(integrationUuid: string, prestaOrder: WoocommerceOrder): Promise<ProxyOrderResponse | { orderUuid: string }> {
        try {
            const isOrderSaved = await this.prestashopModel.checkOrderExists(integrationUuid, prestaOrder.order_id);
            if (isOrderSaved) {
                return await this.baseService.sendOrderId(integrationUuid, prestaOrder.order_id)
            }
            return await this.savePrestaOrder(integrationUuid, prestaOrder)
        } catch (err) {
            const error = new PrestaException('Error executing handlePrestaOrder function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async savePrestaOrder(integrationUuid: string, prestaOrder: WoocommerceOrder): Promise<{ orderUuid: string }> {
        try {
            const prestaOrderJson = JSON.stringify(prestaOrder);
            return await this.prestashopModel.insertOrder(integrationUuid, prestaOrderJson, prestaOrder.order_id)
        } catch (err) {
            const error = new PrestaException('Error executing savePrestaOrder function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private mapPrestaProductForPost(prestaProduct: PrestaProduct): MappedProducts {
        return {products: [prestaProduct]};
    }

    private mapPrestaProductForDelete(productId: string): MappedDeletionProductsId {
        return {
            products: [{
                productId
            }]
        };
    }

    public async sendPrestaShopRequest<T>(
        endpoint: string,
        route: string,
        integrationUuid: string,
        parameters: Record<string, unknown> = {},
        method: HttpMethod = HttpMethod.POST,
        query: string = '',
    ): Promise<T> {
        try {
            const url = new URL(`${endpoint}${PrestaRoutes.V1}${route}`);
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
            const error = new PrestaException(
                'Error executing sendPrestaShopRequest function',
                ExceptionCodeEnum.PRESTA_SERVICE__GENERAL_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
            throw error;
        }
    }

}
