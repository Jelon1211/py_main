import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {BaselinkerModel} from "../../../data-sources/sql/models/baselinker.model";
import {BaselinkerProduct, BaselinkerTokenPayload, BaselinkerTokenRecord, GetBaselinkerOrdersResponse, GetInventoriesResponse} from "../interfaces";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {BaselinkerException} from "../../../exceptions/baselinker.exception";
import {decrypt, encrypt} from "../../../validation/utils/crypto.utils";
import {BaselinkerMethods, BaseLinkerStatusResponse} from "../enums";
import {ValidateUtils} from "../../../validation/utils/validate.utils";
import {inventoriesResponseSchema} from "../schema/baselinker.schema";
import {GetBaselinkerTokenRecord} from "../../../data-sources/sql/db-interfaces/baselinker.interface";
import {BaseService} from "../../base/service/base.service";
import {SupportedPlatforms} from "../../integration/enums";
import {Integration} from "../../integration/interfaces";
import {CanonicalProduct, PlatformService, PropagationObject} from "../../base/interfaces";
import {BaselinkerProductService} from "./baselinker-product.service";
import {BaselinkerApiClientService} from "./baselinker-api-client.service";
import {ProxyOrderResponse} from "../../ebiuro-proxy/intergace";

export class BaselinkerService implements PlatformService {
    private readonly baseService: BaseService = BaseService.getInstance();
    private readonly baselinkerModel: BaselinkerModel = BaselinkerModel.getInstance();
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly apiClient: BaselinkerApiClientService;
    private readonly productService: BaselinkerProductService;

    constructor() {
        this.apiClient = new BaselinkerApiClientService();
        this.productService = new BaselinkerProductService(this.apiClient)
    }

    public getPlatform(): SupportedPlatforms {
        return SupportedPlatforms.BASELINKER;
    }

    public async pushProduct(integration: Integration, canonicalProduct: CanonicalProduct): Promise<void> {
        const baselinkerProduct: BaselinkerProduct = this.baseService.adapter.getAdapter<BaselinkerProduct>(SupportedPlatforms.BASELINKER).toPlatformFormat(canonicalProduct);
        const baselinkerToken = await this.getBaselinkerToken(integration.integration__uuid);

        const baselinkerProducts = await this.productService.getBaselinkerProducts(baselinkerToken.baselinker_token)

        await this.productService.sendProductsToBaselinker(baselinkerProducts, baselinkerProduct, baselinkerToken.baselinker_token)
    }

    public async deleteProduct(integration: Integration, productId: string): Promise<void> {
        const baselinkerToken = await this.getBaselinkerToken(integration.integration__uuid);

        await this.productService.deleteBaselinkerProduct(productId, baselinkerToken.baselinker_token)
    }

    public async handleBaselinkerProductAction(productId: string, integrationUuid: string): Promise<PropagationObject> {
        try {
            const token = await this.getBaselinkerToken(integrationUuid)
            const storageList = await this.productService.getStorageList(token.baselinker_token);
            const productsData = await this.productService.getProductsDataFromStorages(storageList, productId, token.baselinker_token);
            const productDetails: BaselinkerProduct | undefined = productsData.find((product) => product.product_id === Number(productId))

            if (!productDetails) {
                const error = new BaselinkerException('Error executing handleBaselinkerProductAction function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }
            return await this.getBaselinkerProductPropagateObject(integrationUuid, productDetails)

        } catch (err) {
            const error = new BaselinkerException('Error executing handleBaselinkerProductAction function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }

    }

    public async saveBaselinkerToken(baselinkerTokenPayload: BaselinkerTokenPayload): Promise<BaselinkerTokenRecord> {
        try {
            const encryptedXblToken: string = encrypt(baselinkerTokenPayload.xblToken);

            const baselinkerRecord = await this.baselinkerModel.upsertBaselinkerToken(
                baselinkerTokenPayload.uuid,
                encryptedXblToken
            )

            return baselinkerRecord

        } catch (err) {
            const error = new BaselinkerException('Error executing saveBaselinkerToken function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async getBaseLinkerInventories(baselinkerTokenPayload: BaselinkerTokenPayload): Promise<GetInventoriesResponse> {
        try {
            const inventories: GetInventoriesResponse = await this.apiClient.sendBaselinkerRequest(BaselinkerMethods.GET_INVENTORIES, {}, baselinkerTokenPayload.xblToken)
            ValidateUtils.validate(inventories, inventoriesResponseSchema)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (inventories.status === BaseLinkerStatusResponse.ERROR) {
                const error = new BaselinkerException('Error getting inventories', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: inventories});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }

            return inventories

        } catch (err) {
            const error = new BaselinkerException('Error getting inventories', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }

    }

    public async handleBaselinkerOrder(integrationUuid: string, baselinkerOrderId: number): Promise<ProxyOrderResponse | { orderUuid: string }> {
        try {
            const isOrderSaved = await this.baselinkerModel.checkOrderExists(integrationUuid, baselinkerOrderId);

            if (isOrderSaved) {
                return await this.baseService.sendOrderId(integrationUuid, baselinkerOrderId)
            }
            return await this.saveBaselinkerOrder(integrationUuid, baselinkerOrderId)
        } catch (err) {
            const error = new BaselinkerException('Error executing handleBaselinkerOrder function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async saveBaselinkerOrder(integrationUuid: string, baselinkerOrderId: number): Promise<{ orderUuid: string }> {
        try {
            const orderDetails = await this.getOrderDetails(integrationUuid, baselinkerOrderId);
            const baselinkerOrderJson = JSON.stringify(orderDetails);
            return await this.baselinkerModel.insertOrder(integrationUuid, baselinkerOrderJson, baselinkerOrderId)
        } catch (err) {
            const error = new BaselinkerException('Error executing saveBaselinkerOrder function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async getOrderDetails(integrationUuid: string, baselinkerOrderId: number): Promise<GetBaselinkerOrdersResponse> {
        try {
            const parameters = {
                order_id: baselinkerOrderId,
                get_unconfirmed_orders: true
            }
            const token = await this.getBaselinkerToken(integrationUuid)
            return await this.apiClient.sendBaselinkerRequest<GetBaselinkerOrdersResponse>(BaselinkerMethods.GET_ORDERS, parameters, token.baselinker_token)
        } catch (err) {
            const error = new BaselinkerException('Error executing getOrderDetails function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async getBaselinkerToken(integrationUuid: string): Promise<{ baselinker_token: string }> {
        try {
            const response: GetBaselinkerTokenRecord = await this.baselinkerModel.getBaseLinkerTokenByUuid(integrationUuid);

            if (!response || !response.token_uuid) {
                const error = new BaselinkerException('Error executing getBaselinkerToken function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: response});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }

            const decryptedToken: string = decrypt(response.token_uuid);

            return {baselinker_token: decryptedToken};
        } catch (err) {
            const error = new BaselinkerException('Error executing getBaselinkerToken function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    private async getBaselinkerProductPropagateObject(integrationUuid: string, baselinkerProduct: BaselinkerProduct): Promise<PropagationObject> {
        try {
            const canonicalProduct: CanonicalProduct = this.baseService.adapter.getAdapter(SupportedPlatforms.BASELINKER).fromPlatformFormat(baselinkerProduct);

            const integrations: Integration[] | [] = await this.baseService.getAllActiveIntegrationsByIntegrationUuid(integrationUuid)

            return {
                integrations, canonicalProduct
            };

        } catch (err) {
            const error = new BaselinkerException('Error executing getBaselinkerProductPropagateObject function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }
}
