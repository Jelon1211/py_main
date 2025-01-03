import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {Config} from "../../../config-builder/config.interface";
import ConfigBuilder from "../../../config-builder/config-builder";
import {HttpMethod} from "../http-method.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {BaseServiceException} from "../../../exceptions/base-service.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {IntegrationStatusEnum} from "../../integration/enums";
import {Integration} from "../../integration/interfaces";
import {AdapterFactory} from "../factory/adapter.factory";
import {MerchantRecord, MerchantUuid} from "../../../data-sources/sql/db-interfaces/merchant.interface";
import {MerchantModel} from "../../../data-sources/sql/models/merchant.model";
import {IntegrationModel} from "../../../data-sources/sql/models/integration.model";
import {ProxyOrderResponse} from "../../ebiuro-proxy/intergace";
import {ProxyRoutes} from "../../main-router/routes.enum";

export class BaseService {
    private static instance: BaseService | null = null;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly config: Config = ConfigBuilder.getConfig().config;
    public readonly adapter: AdapterFactory = AdapterFactory.getInstance();
    private readonly merchantModel: MerchantModel = MerchantModel.getInstance();
    private readonly integrationModel: IntegrationModel = IntegrationModel.getInstance();


    public static getInstance() {
        if (BaseService.instance) {
            return BaseService.instance;
        }
        return (BaseService.instance = new BaseService());
    }

    public async sendProxyRequest<T>(endpoint: string, parameters: Record<string, unknown> = {}, method: HttpMethod = HttpMethod.POST): Promise<T> {
        try {
            const axiosConfig: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.ebiuroProxy.apiToken}`,
                },
                params: method === HttpMethod.GET ? parameters : {},
            };

            const response: AxiosResponse<T> = method === HttpMethod.GET ? await axios.get(`${this.config.ebiuroProxy.apiUrl}/${endpoint}`, axiosConfig) : await axios.post(`${this.config.ebiuroProxy.apiUrl}/${endpoint}`, parameters, axiosConfig);

            return response.data;
        } catch (err) {
            const error = new BaseServiceException(
                'Error sending ebiuro proxy request',
                ExceptionCodeEnum.BASE_SERVICE__GENERAL_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
            throw error;
        }
    }

    public async getAllActiveIntegrationsByIntegrationUuid(integrationUuid: string): Promise<Integration[] | []> {
        try {
            const merchant: MerchantUuid = await this.merchantModel.getMerchantByIntegrationUuid(integrationUuid);
            const integrationCount: number = await this.integrationModel.countIntegrationByMerchant(merchant.uuid);
            const allIntegrations: Integration[] = await this.integrationModel.getIntegrations(merchant.uuid, 0, integrationCount);
            return this.prepareIntegrationsByIntergrationUuid(allIntegrations, integrationUuid);
        } catch (err) {
            const error = new BaseServiceException('Error executing getAllActiveIntegrations function', ExceptionCodeEnum.BASE_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async getAllActiveIntegrationsByCompanyId(companyId: string, userId: string): Promise<Integration[] | []> {
        try {
            const merchant: MerchantRecord | null = await this.merchantModel.getMerchantByCompanyId(companyId, userId);
            if(merchant === null) {
                const error = new BaseServiceException('No merchant with given companyId and userId', ExceptionCodeEnum.BASE_SERVICE__GENERAL_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }
            const integrationCount: number = await this.integrationModel.countIntegrationByMerchant(merchant.uuid);
            const allIntegrations: Integration[] = await this.integrationModel.getIntegrations(merchant.uuid, 0, integrationCount);
            return this.prepareIntegrations(allIntegrations);
        } catch (err) {
            const error = new BaseServiceException('Error executing getAllActiveIntegrations function', ExceptionCodeEnum.BASE_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async sendOrderId(integrationUuid: string, orderId: number | string): Promise<ProxyOrderResponse> {
        try {
            const payload = {
                integrationUuid,
                orderId
            }
            return await this.sendProxyRequest<Promise<ProxyOrderResponse>>(ProxyRoutes.ORDER, payload);
        }catch (err) {
            const error = new BaseServiceException('Error executing sendOrderId function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private prepareIntegrationsByIntergrationUuid(integrations: Integration[], currentIntegrationUuid: string): Integration[] | [] {
        return integrations.filter((integration) => {
            return integration.integration_settings__status === IntegrationStatusEnum.ACTIVE && integration.integration__uuid !== currentIntegrationUuid
        })
    }

    private prepareIntegrations(integrations: Integration[]): Integration[] | [] {
        return integrations.filter((integration) => {
            return integration.integration_settings__status === IntegrationStatusEnum.ACTIVE
        })
    }

    private getProxyResponse(): { status: number; data: null } {
        // eslint-disable-next-line no-warning-comments
        // TODO: Replace with actual proxy service call
        return {
            status: 201,
            data: null,
        };
    }
}
