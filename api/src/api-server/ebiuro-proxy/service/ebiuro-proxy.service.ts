import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {BaseService} from "../../base/service/base.service";
import {SupportedPlatforms} from "../../integration/enums";
import {Integration} from "../../integration/interfaces";
import {CanonicalProduct, DeletionObject, MerchantObj, PlatformService, PropagationObject} from "../../base/interfaces";
import {EbiuroProxyProduct} from "../intergace";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {EbiuroProxyException} from "../../../exceptions/ebiuro-proxy.exception";
import {Merchant} from "../../../config-builder/config.interface";


export class EbiuroProxyService implements PlatformService {
    private readonly baseService: BaseService = BaseService.getInstance();
    private readonly logger: AppLogger = AppLogger.getInstance();

    constructor() {

    }

    public getPlatform(): SupportedPlatforms {
        return SupportedPlatforms.EBIUROPROXY;
    }

    public async pushProduct(integration: Integration, canonicalProduct: CanonicalProduct): Promise<void> {
        const ebiuroProxyProduct: EbiuroProxyProduct = this.baseService.adapter.getAdapter<EbiuroProxyProduct>(SupportedPlatforms.EBIUROPROXY).toPlatformFormat(canonicalProduct);

        await console.log('tutaj product baselinker----------> ', JSON.stringify(integration), JSON.stringify(ebiuroProxyProduct));
    }

    public async deleteProduct(integration: Integration, productId: string): Promise<void> {
        await console.log(`Usuwam produkt o ID ${productId} z platformy ${this.getPlatform()}`);
    }

    public async getEbiuroProxyProductPropagateObject(merchant: Merchant, ebiuroProxyProduct: EbiuroProxyProduct): Promise<PropagationObject> {
        try {
            const canonicalProduct: CanonicalProduct = this.baseService.adapter.getAdapter(SupportedPlatforms.EBIUROPROXY).fromPlatformFormat(ebiuroProxyProduct);
            const integrations = await this.getAllActiveIntegrations(merchant);

            return {
                integrations, canonicalProduct
            };

        } catch (err) {
            const error = new EbiuroProxyException('Error executing getEbiuroProxyProductPropagateObject function', ExceptionCodeEnum.EBIUROPROXY__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async getEbiuroProxyProductDeletionObject(merchant: Merchant, productId: string): Promise<DeletionObject> {
        try {
            const integrations = await this.getAllActiveIntegrations(merchant);

            return {
                integrations, productId
            };

        } catch (err) {
            const error = new EbiuroProxyException('Error executing getEbiuroProxyProductDeletionObject function', ExceptionCodeEnum.EBIUROPROXY__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async getAllActiveIntegrations(merchant: Merchant): Promise<Integration[]> {
        try {
            return await this.baseService.getAllActiveIntegrationsByCompanyId(merchant.company_id, merchant.user_id)
        }catch (err) {
            const error = new EbiuroProxyException('Error executing getAllActiveIntegrations function', ExceptionCodeEnum.EBIUROPROXY__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

}
