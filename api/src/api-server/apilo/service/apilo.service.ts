import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {ApiloModel} from "../../../data-sources/sql/models/apilo.model";
import {
    ApiloOrder,
    ApiloPingResponse,
    ApiloProductDetails,
    ApiloProductPostResponse, ApiloProductPut, ApiloProductPutResponse,
    AplioTokenRecord,
    AuthApiloResponse,
    InitApiloPayload,
    InitApiloRecord,
    InsertApiloTokenPayload,
    UpdateApiloTokenPayload
} from "../interfaces";
import {encodeToBase64} from "../../../validation/utils/base64encode.util";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {ApiloException} from "../../../exceptions/apilo.exception";
import {ApiloApiRoutes, ApiloTokenData} from "../enums";
import {decrypt, encrypt} from "../../../validation/utils/crypto.utils";
import {ValidateUtils} from "../../../validation/utils/validate.utils";
import {apiloTokenSchema, getRestApiloTokenSchema} from "../schema/apilo.schema";
import {InfoLog} from "../../../loggers/info-log/info-log.instance";
import {BaseService} from "../../base/service/base.service";
import {HttpMethod} from "../../base/http-method.enum";
import {CanonicalProduct, PlatformService, PropagationObject} from "../../base/interfaces";
import {SupportedPlatforms} from "../../integration/enums";
import {Integration} from "../../integration/interfaces";
import {ApiloApiClientService} from "./apilo-api-client.service";
import {ApiloProductService} from "./apilo-product.service";
import {ProxyOrderResponse} from "../../ebiuro-proxy/intergace";

export class ApiloService implements PlatformService {
    private readonly baseService: BaseService = BaseService.getInstance();
    private readonly apiloModel: ApiloModel = ApiloModel.getInstance();
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly apiClient: ApiloApiClientService;
    private readonly productService: ApiloProductService;

    constructor() {
        this.apiClient = new ApiloApiClientService();
        this.productService = new ApiloProductService(this.apiClient)
    }

    public getPlatform(): SupportedPlatforms {
        return SupportedPlatforms.APILO;
    }

    public async pushProduct(integration: Integration, canonicalProduct: CanonicalProduct): Promise<void> {
        const apiloAdapter = this.baseService.adapter.getAdapter<ApiloProductDetails>(SupportedPlatforms.APILO);
        const apiloProduct = apiloAdapter.toPlatformFormat(canonicalProduct);
        const apiloTokenData = await this.getApiloToken(integration.integration__uuid);

        const existingProductsResponse = await this.productService.getApiloProducts(apiloTokenData);
        const existingProductMap = new Map(
            existingProductsResponse.map((product) => [product.sku, product])
        );


        const preparedProducts: ApiloProductDetails[] = [];
        const putProducts: ApiloProductPut[] = [];

        if (existingProductMap.has(apiloProduct.sku)) {
            const existingProduct = existingProductMap.get(apiloProduct.sku);
            if (existingProduct?.id) {
                putProducts.push({
                    id: existingProduct.id,
                    ...apiloProduct,
                });
            }
        } else {
            preparedProducts.push(apiloProduct);
        }

        const postResponses: ApiloProductPostResponse[] = [];
        const putResponses: ApiloProductPutResponse[] = [];

        if (putProducts.length > 0) {
            const response = await this.productService.sendProductsToApilo<ApiloProductPutResponse>(putProducts, apiloTokenData, HttpMethod.PUT);
            putResponses.push(...(Array.isArray(response) ? response : [response]));
        }

        if (preparedProducts.length > 0) {
            const response = await this.productService.sendProductsToApilo<ApiloProductPostResponse>(preparedProducts, apiloTokenData, HttpMethod.POST);
            postResponses.push(...(Array.isArray(response) ? response : [response]));
        }

        this.logger.log(LoggerLevelEnum.INFO, new InfoLog('POST Responses:', {postResponses: JSON.stringify(postResponses)}));
        this.logger.log(LoggerLevelEnum.INFO, new InfoLog('PUT Responses:', {putResponses: JSON.stringify(putResponses)}));
        this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Product processing completed.'));
    }

    public async deleteProduct(integration: Integration, productId: string): Promise<void> {
        try {
            const apiloTokenData = await this.getApiloToken(integration.integration__uuid);
            await this.productService.deleteApiloProduct(productId, apiloTokenData)
        }catch (err) {
            const error = new ApiloException('Error executing getApiloPropagationObject function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async getApiloPropagationObject(integrationUuid: string, apiloProduct: ApiloProductDetails): Promise<PropagationObject> {
        try {
            const canonicalProduct: CanonicalProduct = this.baseService.adapter.getAdapter(SupportedPlatforms.APILO).fromPlatformFormat(apiloProduct);

            const integrations: Integration[] | [] = await this.baseService.getAllActiveIntegrationsByIntegrationUuid(integrationUuid)

            return {
                integrations, canonicalProduct
            };

        } catch (err) {
            const error = new ApiloException('Error executing getApiloPropagationObject function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }

    }

    public async initApilo(initApiloPayload: InitApiloPayload): Promise<InitApiloRecord> {
        try {
            const basic = encodeToBase64(`${initApiloPayload.clientId}:${initApiloPayload.clientSecret}`)

            const response: AuthApiloResponse = await this.apiClient.sendApiloRequest<AuthApiloResponse>(`${initApiloPayload.apiEndpoint}${ApiloApiRoutes.REST_AUTH_PATH}/`, {
                grantType: "authorization_code",
                token: initApiloPayload.authCode,
                developerId: null
            }, `Basic ${basic}`)
            ValidateUtils.validate(response, getRestApiloTokenSchema)

            const accessTokenExpireTimestamp = new Date(response.accessTokenExpireAt).getTime() / 1000;
            const refreshTokenExpireTimestamp = new Date(response.refreshTokenExpireAt).getTime() / 1000;

            const encryptedAccessToken = encrypt(response.accessToken);
            const encryptedRefreshToken = encrypt(response.refreshToken);

            const encryptedClientSecret = encrypt(initApiloPayload.clientSecret);

            const insertApiloTokenPayload: InsertApiloTokenPayload = {
                integration_uuid: initApiloPayload.uuid,
                endpoint: initApiloPayload.apiEndpoint,
                client_secret: encryptedClientSecret,
                client_id: initApiloPayload.clientId,
                access_token: encryptedAccessToken,
                access_token_expire_at: accessTokenExpireTimestamp,
                refresh_token: encryptedRefreshToken,
                refresh_token_expire_at: refreshTokenExpireTimestamp
            }

            const result = await this.apiloModel.insertApiloToken(insertApiloTokenPayload);

            if (!result.token_uuid) {
                const error = new ApiloException('Error inserting apilo token', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }

            const tokenUuid = result.token_uuid;


            return {token_uuid: tokenUuid}

        } catch (err) {
            const error = new ApiloException('Error executing initApilo function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async pingApilo(endpoint: string, integrationUuid: string): Promise<ApiloPingResponse> {
        try {
            const token = await this.getApiloToken(integrationUuid)
            ValidateUtils.validate(token, apiloTokenSchema)

            return await this.apiClient.sendApiloRequest(`${endpoint}${ApiloApiRoutes.REST_API_PATH}`, {}, `Bearer ${token.access_token}`, HttpMethod.GET)
        } catch (err) {
            const error = new ApiloException('Error executing pingApilo function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }

    }

    public async handleApiloOrder(integrationUuid: string, apiloOrderId: string): Promise<ProxyOrderResponse | { orderUuid: string }> {
        try {
            const isOrderSaved = await this.apiloModel.checkOrderExists(integrationUuid, apiloOrderId);
            if (isOrderSaved) {
                return await this.baseService.sendOrderId(integrationUuid, apiloOrderId)
            }
            return await this.saveApiloOrder(integrationUuid, apiloOrderId)
        } catch (err) {
            const error = new ApiloException('Error executing handleApiloOrder function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async saveApiloOrder(integrationUuid: string, apiloOrderId: string): Promise<{ orderUuid: string }> {
        try {
            const orderDetails = await this.getOrderDetails(integrationUuid, apiloOrderId);
            const apiloOrderJson = JSON.stringify(orderDetails);
            return await this.apiloModel.insertOrder(integrationUuid, apiloOrderJson, apiloOrderId)
        } catch (err) {
            const error = new ApiloException('Error executing saveApiloOrder function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async getOrderDetails(integrationUuid: string, apiloOrderId: string): Promise<ApiloOrder> {
        try {
            const token = await this.getApiloToken(integrationUuid)
            return await this.apiClient.sendApiloRequest(
                `${token.endpoint}${ApiloApiRoutes.REST_API_PATH}${ApiloApiRoutes.ORDER_PATH}/${apiloOrderId}`,
                {},
                `Bearer ${token.access_token}`,
                HttpMethod.GET
            )
        } catch (err) {
            const error = new ApiloException('Error executing getOrderDetails function', ExceptionCodeEnum.WOO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async getApiloToken(integrationUuid: string): Promise<AplioTokenRecord> {
        try {
            const apiloToken: AplioTokenRecord = await this.apiloModel.getApiloToken(integrationUuid);

            try {
                const accessTokenDecrypted = decrypt(apiloToken.access_token);
                const refreshTokenDecrypted = decrypt(apiloToken.refresh_token);
                const refreshClientSecret = decrypt(apiloToken.client_secret);

                apiloToken.access_token = accessTokenDecrypted;
                apiloToken.refresh_token = refreshTokenDecrypted;
                apiloToken.client_secret = refreshClientSecret;

            } catch (decryptionError) {
                const error = new ApiloException('Error executing getApiloToken function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: decryptionError});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }

            return await this.checkTokenExpire(apiloToken);
        } catch (err) {
            const error = new ApiloException('Error executing getApiloToken function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    private async checkTokenExpire(apiloToken: AplioTokenRecord): Promise<AplioTokenRecord> {
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationThreshold = ApiloTokenData.EXPIRE_THRESHOLD / 1000;

        if (!apiloToken.access_token_expire_at || currentTime >= apiloToken.access_token_expire_at - expirationThreshold) {
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Token is close to expiration or expired. Refreshing token...', {userToken: apiloToken}));

            const refreshTokenResponse = await this.refreshToken(apiloToken);

            const accessTokenExpireTimestamp = Math.floor(new Date(refreshTokenResponse.accessTokenExpireAt).getTime() / 1000);
            const refreshTokenExpireTimestamp = Math.floor(new Date(refreshTokenResponse.refreshTokenExpireAt).getTime() / 1000);

            const encryptedAccessToken = encrypt(refreshTokenResponse.accessToken);
            const encryptedRefreshToken = encrypt(refreshTokenResponse.refreshToken);

            const updateApiloTokenPayload: UpdateApiloTokenPayload = {
                uuid: apiloToken.uuid,
                accessToken: encryptedAccessToken,
                accessTokenExpireAt: accessTokenExpireTimestamp,
                refreshToken: encryptedRefreshToken,
                refreshTokenExpireAt: refreshTokenExpireTimestamp,
            }

            try {
                await this.apiloModel.updateApiloToken(updateApiloTokenPayload);

                apiloToken.access_token = refreshTokenResponse.accessToken;
                apiloToken.refresh_token = refreshTokenResponse.refreshToken;
                apiloToken.access_token_expire_at = accessTokenExpireTimestamp;
                apiloToken.refresh_token_expire_at = refreshTokenExpireTimestamp;

            } catch (err) {
                const error = new ApiloException('Error executing checkTokenExpire function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }
        }

        return apiloToken;
    }

    private async refreshToken(apiloToken: AplioTokenRecord): Promise<AuthApiloResponse> {
        const basic = encodeToBase64(`${apiloToken.client_id}:${apiloToken.client_secret}`)

        try {
            return await this.apiClient.sendApiloRequest<AuthApiloResponse>(`${apiloToken.endpoint}${ApiloApiRoutes.REST_AUTH_PATH}/`, {
                grantType: "refresh_token",
                token: apiloToken.refresh_token,
                developerId: null
            }, `Basic ${basic}`);
        } catch (err) {
            const error = new ApiloException('Error executing refreshToken function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

}
