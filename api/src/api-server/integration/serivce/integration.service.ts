import {IntegrationModel} from "../../../data-sources/sql/models/integration.model";
import {
    CheckIntegrationPayload,
    checkIntegrationResponse,
    CreateIntegrationPayload,
    DeleteIntegrationRecord,
    InitBaseLinkerIntegrationPayload,
    Integration,
    IntegrationSettings,
    UpdatedIntegrationRecord,
    UpdateIntegrationPayload,
    UpdateIntegrationStatusPayload
} from "../interfaces";
import {Merchant} from "../../../config-builder/config.interface";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {IntegrationException} from "../../../exceptions/integration.exception";
import {IntegrationStatusEnum, StatusHttp, SupportedPlatforms} from "../enums";
import {InfoLog} from "../../../loggers/info-log/info-log.instance";
import {PrestaRoutes, WoocommerceRoutes} from "../../main-router/routes.enum";
import {BaselinkerService} from "../../baselinker/service/baselinker.service";
import {BaselinkerTokenPayload, GetInventoriesResponse} from "../../baselinker/interfaces";
import {BaseLinkerStatusResponse} from "../../baselinker/enums";
import {BaseService} from "../../base/service/base.service";
import {HttpMethod} from "../../base/http-method.enum";
import {WoocommerceService} from "../../woocommerce/service/woocommerce.service";
import {PrestaService} from "../../prestashop/service/presta.service";

export class IntegrationService extends BaseService {
    private readonly integrationModel: IntegrationModel = IntegrationModel.getInstance();
    private readonly baselinkerService = new BaselinkerService();
    private readonly woocommerceService: WoocommerceService = new WoocommerceService();
    private readonly prestaService: PrestaService = new PrestaService();
    private readonly logger: AppLogger = AppLogger.getInstance();

    public async getIntegrations(merchant: Merchant): Promise<Integration[] | []> {
        try {
            return await this.integrationModel.getIntegrations(merchant.uuid, 0, 100)
        } catch (err) {
            const error = new IntegrationException('Error getting integration list', ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async createIntegration(createIntegrationPayload: CreateIntegrationPayload): Promise<{ integrationUuid: string }> {
        try {
            this.validateIntegrationPayload(createIntegrationPayload);

            const proxyResponse = this.getProxyResponse();

            this.validateProxyResponse(proxyResponse);

            const insertIntegration = await this.integrationModel.insertIntegration(
                createIntegrationPayload.merchantUuid,
                createIntegrationPayload.integrationName,
                createIntegrationPayload.platform,
                this.getSiteUrlForPlatform(createIntegrationPayload.platform, createIntegrationPayload.siteUrl)
            );

            if (createIntegrationPayload.platform === SupportedPlatforms.BASELINKER) {
                await this.handleBaseLinkerIntegration(insertIntegration.integration_uuid, createIntegrationPayload.xblToken!);
            }

            return {integrationUuid: insertIntegration.integration_uuid};
        } catch (err) {
            const error = new IntegrationException(
                'Error creating new integration',
                ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async updateIntegrationStatus(integrationStatus: UpdateIntegrationStatusPayload): Promise<UpdatedIntegrationRecord | null> {
        try {

            const mappedStatus = this.mapStatusToEnum(integrationStatus.status);

            if (!mappedStatus) {
                const error = new IntegrationException(
                    `Invalid status value: ${integrationStatus.status}`,
                    ExceptionCodeEnum.PROXY_SERVICE__UNEXPECTED_STATUS,
                    {cause: mappedStatus}
                );
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            return await this.integrationModel.updateIntegration(
                integrationStatus.uuid,
                null,
                null,
                null,
                mappedStatus,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
            );

        } catch (err) {
            const error = new IntegrationException(
                'Error updating integration status',
                ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async updateIntegration(updateIntegrationObject: UpdateIntegrationPayload): Promise<UpdatedIntegrationRecord | null> {
        try {
            this.validateIntegrationPayload(updateIntegrationObject);
            // eslint-disable-next-line no-sync
            if (updateIntegrationObject.inventorySync) {
                this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Starting synchronizing inventory', {updateIntegrationObject}));
            }

            if (updateIntegrationObject.platform === SupportedPlatforms.BASELINKER) {
                await this.handleBaseLinkerIntegration(updateIntegrationObject.uuid, updateIntegrationObject.xblToken as string);
            }

            return await this.integrationModel.updateIntegration(
                updateIntegrationObject.uuid,
                updateIntegrationObject.integrationName,
                updateIntegrationObject.platform || null,
                this.getSiteUrlForPlatform(updateIntegrationObject.platform, updateIntegrationObject.siteUrl),
                updateIntegrationObject.status || null,
                updateIntegrationObject.isDeleted || null,
                updateIntegrationObject.invoiceStatusTrigger || null,
                updateIntegrationObject.invoiceNumbering || null,
                updateIntegrationObject.receiptNumbering || null,
                updateIntegrationObject.warehouse || null,
                updateIntegrationObject.productGroup || null,
                updateIntegrationObject.priceGroup || null,
                updateIntegrationObject.syncDirection || null,
            )

        } catch (err) {
            const error = new IntegrationException('Error updating integration', ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async deleteIntegration(uuid: string): Promise<DeleteIntegrationRecord> {
        try {
            const deleteIntegrationRecord: UpdatedIntegrationRecord | null = await this.integrationModel.updateIntegration(
                uuid,
                null,
                null,
                null,
                null,
                1,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
            )
            if (!deleteIntegrationRecord) {
                return {
                    success: false,
                    uuid
                }
            }
            return {
                success: true,
                uuid
            }
        } catch (err) {
            const error = new IntegrationException('Error deleting integration', ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async checkIntegration(checkIntegrationPayload: CheckIntegrationPayload): Promise<IntegrationSettings> {
        try {
            // eslint-disable-next-line no-warning-comments
            // TODO: here ebiuro proxy call
            const settings: IntegrationSettings = {
                invoice: [],
                receipt: [],
                companyWarehouses: [],
                priceGroups: [],
                productGroups: [],
            }

            switch (checkIntegrationPayload.platform as SupportedPlatforms) {
                case SupportedPlatforms.WOOCOMMERCE: {
                    const wpResponse: checkIntegrationResponse = await this.woocommerceService.sendWooCommerceRequest<checkIntegrationResponse>(checkIntegrationPayload.siteUrl, WoocommerceRoutes.INTEGRATION, checkIntegrationPayload.uuid,{}, HttpMethod.GET, `integration_uuid=${checkIntegrationPayload.uuid}`)
                    if (wpResponse.status === StatusHttp.SUCCESS) {
                        settings['documentAction'] = wpResponse.data.statuses
                    }
                }
                    break;
                case SupportedPlatforms.PRESTASHOP: {
                    const wpResponse: checkIntegrationResponse = await this.prestaService.sendPrestaShopRequest<checkIntegrationResponse>(checkIntegrationPayload.siteUrl, PrestaRoutes.INTEGRATION, checkIntegrationPayload.uuid, {}, HttpMethod.GET, `integration_uuid=${checkIntegrationPayload.uuid}`)
                    if (wpResponse.status === StatusHttp.SUCCESS) {
                        settings['documentAction'] = wpResponse.data.statuses
                    }
                }
                    break;
                default: {
                    const error = new IntegrationException(
                        'Not supported platform',
                        ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR
                    );
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                    throw error;
                }
            }


            return settings;

        } catch (err) {
            const error = new IntegrationException('Error checking integration', ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async initBaseLinkerIntegration(initBaseLinkerIntegrationPayload: InitBaseLinkerIntegrationPayload): Promise<IntegrationSettings> {
        try {
            if(initBaseLinkerIntegrationPayload.platform !== SupportedPlatforms.BASELINKER){
                const error = new IntegrationException('Not supported platform', ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }
            const inventoriesPayload: BaselinkerTokenPayload = {
                uuid: initBaseLinkerIntegrationPayload.uuid,
                xblToken: initBaseLinkerIntegrationPayload.xblToken
            }

            const baselinkerResponse: GetInventoriesResponse = await this.baselinkerService.getBaseLinkerInventories(inventoriesPayload)

            if(baselinkerResponse.status !== BaseLinkerStatusResponse.SUCCESS) {
                const error = new IntegrationException('Not supported platform', ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR, {cause: baselinkerResponse});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }

            // eslint-disable-next-line no-warning-comments
            // TODO: here ebiuro proxy call
            const settings: IntegrationSettings = {
                invoice: [],
                receipt: [],
                companyWarehouses: [],
                priceGroups: [],
                productGroups: [],
            }


            return settings;

        } catch (err) {
            const error = new IntegrationException('Error checking integration', ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    private getSiteUrlForPlatform(platform: string, siteUrl: string | null): string | null {
        switch (platform as SupportedPlatforms) {
            case SupportedPlatforms.BASELINKER:
            case SupportedPlatforms.APILO:
                return null;
            default:
                return siteUrl;
        }
    }

    private mapStatusToEnum(status: string): IntegrationStatusEnum | null {
        switch (status) {
            case 'activate':
                return IntegrationStatusEnum.ACTIVE;
            case 'deactivate':
                return IntegrationStatusEnum.INACTIVE;
            default:
                return null;
        }
    }

    private validateIntegrationPayload(payload: CreateIntegrationPayload | UpdateIntegrationPayload): void {
        if (payload.platform === SupportedPlatforms.BASELINKER && !payload.xblToken) {
            const error = new IntegrationException(
                'No xblToken provided for BaseLinker integration',
                ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private getProxyResponse(): { status: number; data: null } {
        // eslint-disable-next-line no-warning-comments
        // TODO: Replace with actual proxy service call
        return {
            status: 201,
            data: null,
        };
    }

    private validateProxyResponse(response: { status: number }): void {
        if (response.status !== 201) {
            const error = new IntegrationException(
                `Proxy responded with unexpected status: ${response.status}`,
                ExceptionCodeEnum.PROXY_SERVICE__UNEXPECTED_STATUS,
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async handleBaseLinkerIntegration(integrationUuid: string, xblToken: string): Promise<void> {
        const baselinkerTokenPayload: BaselinkerTokenPayload = {
            uuid: integrationUuid,
            xblToken,
        };

        const tokenUuid = await this.baselinkerService.saveBaselinkerToken(baselinkerTokenPayload);

        if (!tokenUuid.token_uuid) {
            const error = new IntegrationException(
                'Error saving BaseLinker token',
                ExceptionCodeEnum.INTEGRATION_SERVICE__GENERAL_ERR
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }
}
