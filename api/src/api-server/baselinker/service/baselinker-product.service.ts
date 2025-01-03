import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {BaselinkerApiClientService} from "./baselinker-api-client.service";
import {
    BaselinkerCategory,
    BaselinkerGetCategoriesResponse,
    BaselinkerGetStoragesList,
    BaselinkerInventory,
    BaselinkerProduct, BaselinkerProductAddResponse, BaselinkerProductsDict, DeleteBaselinkerProduct,
    GetInventoriesResponse,
    GetInventoryProductsDataResponse,
    GetInventoryProductsListResponse,
    ProductsResponse
} from "../interfaces";
import {BaselinkerMethods, BaseLinkerStatusResponse, BaseLinkerStorageId} from "../enums";
import {BaselinkerException} from "../../../exceptions/baselinker.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {StatusHttp} from "../../integration/enums";
import {InfoLog} from "../../../loggers/info-log/info-log.instance";


export class BaselinkerProductService {
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly apiClient: BaselinkerApiClientService;

    constructor(apiClient: BaselinkerApiClientService) {
        this.apiClient = apiClient;
    }

    public async getStorageList(token: string): Promise<BaselinkerGetStoragesList> {
        try {
            const storageList: BaselinkerGetStoragesList = await this.apiClient.sendBaselinkerRequest<BaselinkerGetStoragesList>(BaselinkerMethods.GET_STORAGES_LIST, {}, token);
            return storageList;
        } catch (err) {
            const error = new BaselinkerException('Error executing getStorageList function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async getProductsDataFromStorages(storageList: BaselinkerGetStoragesList, productId: string, token: string): Promise<BaselinkerProduct[]> {
        try {
            const productRequests = storageList.storages.map((storage) =>
                this.apiClient.sendBaselinkerRequest<ProductsResponse>(
                    BaselinkerMethods.GET_PRODUCTS_DATA,
                    {
                        storage_id: storage.storage_id,
                        products: [productId]
                    },
                    token
                )
            );

            const productResponses: ProductsResponse[] = await Promise.all(productRequests);
            const productsData: BaselinkerProduct[] = [];

            console.log('productResponses ---> ', JSON.stringify(productResponses))


            productResponses.forEach((response) => {
                if (response.status === StatusHttp.SUCCESS && response.products[productId]) {
                    const product = response.products[productId];

                    productsData.push(product);
                }
            });

            return productsData;
        } catch (err) {
            const error = new BaselinkerException('Error executing getProductsDataFromStorages function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async getBaselinkerProducts(token: string): Promise<BaselinkerInventory[]> {
        try {
            const inventories: GetInventoriesResponse = await this.apiClient.sendBaselinkerRequest<GetInventoriesResponse>(
                BaselinkerMethods.GET_INVENTORIES,
                {},
                token
            );
            const allProductsData: BaselinkerInventory[] = [];

            const inventoryPromises = inventories.inventories.map(async (inventory) => {
                const products: GetInventoryProductsListResponse = await this.apiClient.sendBaselinkerRequest<GetInventoryProductsListResponse>(
                    BaselinkerMethods.GET_INVENTORY_PRODUCTS_LIST,
                    {inventory_id: inventory.inventory_id},
                    token
                );

                if (products.products && Object.keys(products.products).length > 0) {
                    const productIds = Object.keys(products.products).map((id) => parseInt(id));

                    const productsData: GetInventoryProductsDataResponse = await this.apiClient.sendBaselinkerRequest<GetInventoryProductsDataResponse>(
                        BaselinkerMethods.GET_INVENTORY_PRODUCTS_DATA,
                        {
                            inventory_id: inventory.inventory_id,
                            products: productIds,
                        },
                        token
                    );

                    allProductsData.push({inventory_id: inventory.inventory_id, products: productsData.products});
                }
            });

            await Promise.all(inventoryPromises);

            return allProductsData;
        } catch (err) {
            const error = new BaselinkerException('Error executing getBaselinkerProducts function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async sendProductsToBaselinker(baselinkerProducts: BaselinkerInventory[], baselinkerProduct: BaselinkerProduct, token: string): Promise<void> {
        try {
            const storageList: BaselinkerGetStoragesList = await this.getStorageList(token);

            const categoriesResponse: BaselinkerGetCategoriesResponse[] = await this.getCategoriesFromStorages(storageList, token);

            const categoriesMap = new Map<string, BaselinkerCategory[]>();
            for (const storage of categoriesResponse) {
                categoriesMap.set(storage.storage_id, storage.categories);
            }

            const baselinkerProductsDict = this.createBaselinkerProductDictionary(baselinkerProducts);

            const mappedProduct = {
                storage_id: BaseLinkerStorageId.BL,
                ...baselinkerProduct,
                product_id: baselinkerProductsDict[baselinkerProduct.product_id] ? baselinkerProduct.product_id : '',
            }

            const response = await this.apiClient.sendBaselinkerRequest<BaselinkerProductAddResponse>(BaselinkerMethods.ADD_PRODUCT, mappedProduct, token);
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Baselinker product response:', {response: JSON.stringify(response)}));

            if (response.status === BaseLinkerStatusResponse.ERROR) {
                const error = new BaselinkerException('Error for BaseLinker send product response', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }
        } catch (err) {
            const error = new BaselinkerException('Error executing sendProductsToBaselinker function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    public async deleteBaselinkerProduct(productId: string, token: string): Promise<void> {
        try {
            const deleteProductObj = {
                storage_id: BaseLinkerStorageId.BL,
                product_id: productId
            }
            const response = await this.apiClient.sendBaselinkerRequest<DeleteBaselinkerProduct>(BaselinkerMethods.DELETE_PRODUCT, deleteProductObj, token);

            if (response.status === BaseLinkerStatusResponse.ERROR) {
                const error = new BaselinkerException('Error for BaseLinker delete product response', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error
            }
        } catch (err) {
            const error = new BaselinkerException('Error executing deleteBaselinkerProduct function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    private async getCategoriesFromStorages(storageList: BaselinkerGetStoragesList, token: string): Promise<Awaited<BaselinkerGetCategoriesResponse>[]> {
        try {
            const categoryRequests = storageList.storages.map(storage =>
                this.apiClient.sendBaselinkerRequest<BaselinkerGetCategoriesResponse>(
                    BaselinkerMethods.GET_CATEGORIES,
                    {storage_id: storage.storage_id},
                    token
                )
            );

            return await Promise.all(categoryRequests);
        } catch (err) {
            const error = new BaselinkerException('Error executing getCategoriesFromStorages function', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

    private createBaselinkerProductDictionary(baselinkerData: BaselinkerInventory[]) {
        const productDict: BaselinkerProductsDict = {};
        baselinkerData.forEach((inventory) => {
            Object.keys(inventory.products).forEach((productId) => {
                productDict[productId] = true;
            });
        });
        return productDict;
    }

}
