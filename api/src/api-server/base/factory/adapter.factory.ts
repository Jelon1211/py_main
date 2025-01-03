import {SupportedPlatforms} from "../../integration/enums";
import {CanonicalProduct, ProductAdapter} from "../interfaces";
import {WooCommerceAdapter} from "../../woocommerce/adapter/woocommerce.adapter";
import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {AdapterFactoryException} from "../../../exceptions/adapter-factory.exception";
import {ApiloAdapter} from "../../apilo/adapter/apilo.adapter";
import {PrestaAdapter} from "../../prestashop/adapter/presta.adapter";
import {BaselinkerAdapter} from "../../baselinker/adapter/baselinker.adapter";
import {EbiuroProxyAdapter} from "../../ebiuro-proxy/adapter/ebiuro-proxy.adapter";

export class AdapterFactory {
    private static instance: AdapterFactory | null = null;
    private readonly logger: AppLogger = AppLogger.getInstance();

    private constructor() {
    }

    public static getInstance() {
        if (AdapterFactory.instance) {
            return AdapterFactory.instance;
        }
        return (AdapterFactory.instance = new AdapterFactory());
    }

    public getAdapter<TPlatformProduct>(supportedPlatforms: SupportedPlatforms): ProductAdapter<TPlatformProduct, CanonicalProduct> {
        switch (supportedPlatforms) {
            case SupportedPlatforms.WOOCOMMERCE:
                return new WooCommerceAdapter() as ProductAdapter<TPlatformProduct, CanonicalProduct>;
            case SupportedPlatforms.PRESTASHOP:
                return new PrestaAdapter() as ProductAdapter<TPlatformProduct, CanonicalProduct>;
            case SupportedPlatforms.APILO:
                return new ApiloAdapter() as ProductAdapter<TPlatformProduct, CanonicalProduct>;
            case SupportedPlatforms.BASELINKER:
                return new BaselinkerAdapter() as ProductAdapter<TPlatformProduct, CanonicalProduct>;
            case SupportedPlatforms.EBIUROPROXY:
                return new EbiuroProxyAdapter() as ProductAdapter<TPlatformProduct, CanonicalProduct>;
            default: {
                const error = new AdapterFactoryException('No adapter found', ExceptionCodeEnum.ADAPTER_FACTORY__GENERAL_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }
        }
    }
}