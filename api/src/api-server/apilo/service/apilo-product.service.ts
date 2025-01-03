import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {ApiloApiClientService} from "./apilo-api-client.service";
import {ApiloProductDetails, ApiloProductGetResponse, AplioTokenRecord} from "../interfaces";
import {ApiloApiRoutes, ApiloProdcutData} from "../enums";
import {HttpMethod} from "../../base/http-method.enum";
import {ApiloException} from "../../../exceptions/apilo.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {chunkArray} from "../../../validation/utils/chunking";


export class ApiloProductService {
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly apiClient: ApiloApiClientService;

    constructor(apiClient: ApiloApiClientService) {
        this.apiClient = apiClient;
    }

    public async getApiloProducts(apiloTokenData: AplioTokenRecord): Promise<ApiloProductDetails[]> {

        const allApiloProducts: ApiloProductDetails[] = [];
        const limit = ApiloProdcutData.LIMIT;
        let offset = 0;
        let totalCount = 0;

        try {
            do {
                const queryParams = {
                    limit: limit,
                    offset: offset
                };

                const response = await this.apiClient.sendApiloRequest<ApiloProductGetResponse>(
                    `${apiloTokenData.endpoint}${ApiloApiRoutes.REST_API_PATH}${ApiloApiRoutes.PRODUCT_PATH}/?offset=${queryParams.offset}&limit=${queryParams.limit}`,
                    {},
                    `Bearer ${apiloTokenData.access_token}`,
                    HttpMethod.GET
                );

                const products: ApiloProductDetails[] = response.products;
                totalCount = response.totalCount;

                allApiloProducts.push(...products);

                offset += limit;

            } while (offset < totalCount);

        } catch (err) {
            const error = new ApiloException('Error executing getApiloProducts function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }

        return allApiloProducts;
    }

    public async sendProductsToApilo<T>(
        products: ApiloProductDetails[],
        apiloTokenData: AplioTokenRecord,
        method: HttpMethod
    ): Promise<T | T[]> {
        const endpoint = `${apiloTokenData.endpoint}${ApiloApiRoutes.REST_API_PATH}${ApiloApiRoutes.PRODUCT_PATH}/`;
        const chunkSize = ApiloProdcutData.CHUNK_SIZE;
        const auth = `Bearer ${apiloTokenData.access_token}`;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        const productChunks = products.length > chunkSize ? chunkArray(products, chunkSize) : [products];
        const responses: T[] = [];

        for (const chunk of productChunks) {
            try {
                // const payload = {products: chunk};

                const response = await this.apiClient.sendApiloRequest<T>(endpoint, chunk, auth, method);
                responses.push(response);
            } catch (err) {
                const error = new ApiloException('Error executing sendProxyProductsToApilo function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }
        }

        return responses.length === 1 ? responses[0] : responses;
    }

    public async deleteApiloProduct(productId: string, apiloTokenData: AplioTokenRecord): Promise<[]> {
        try {
            const endpoint = `${apiloTokenData.endpoint}${ApiloApiRoutes.REST_API_PATH}${ApiloApiRoutes.PRODUCT_PATH}/${productId}/`;
            const auth = `Bearer ${apiloTokenData.access_token}`;

            await this.apiClient.sendApiloRequest(endpoint, {}, auth, HttpMethod.DELETE)

            return []
        }catch (err) {
            const error = new ApiloException('Error executing deleteApiloProduct function', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }
}
