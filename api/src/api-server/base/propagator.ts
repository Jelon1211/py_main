import {CanonicalProduct, PlatformService} from "./interfaces";
import {Integration} from "../integration/interfaces";
import {AppLogger} from "../../loggers/logger-service/logger.service";
import {LoggerLevelEnum} from "../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../loggers/error-log/error-log.instance";
import {PropagatorException} from "../../exceptions/propagator.exception";
import {ExceptionCodeEnum} from "../../exceptions/exception-code.enum";
import {InfoLog} from "../../loggers/info-log/info-log.instance";
import {SupportedPlatforms} from "../integration/enums";

export class Propagator {
    private readonly platformServiceMap: Map<SupportedPlatforms, PlatformService>;
    private readonly logger: AppLogger = AppLogger.getInstance();

    constructor(services: PlatformService[]) {
        this.platformServiceMap = new Map(
            services.map((service) => [service.getPlatform(), service])
        );
    }

    async propagateProduct(integration: Integration, canonicalProduct: CanonicalProduct): Promise<void> {
        const platform = integration.integration_settings__platform;
        const service = this.platformServiceMap.get(platform);

        if (!service) {
            const error = new PropagatorException(`No service found for platform: ${platform}`, ExceptionCodeEnum.PROPAGATOR__GENERAL_ERR);
            this.logger.log(LoggerLevelEnum.WARN, new ErrorLog(error));
            return;
        }

        try {
            await service.pushProduct(integration, canonicalProduct);
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog(`Product propagated to ${service.constructor.name}`));
        } catch (err) {
            const error = new PropagatorException(`Error propagating product to ${platform}`, ExceptionCodeEnum.PROPAGATOR__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    async removeProduct(integration: Integration, productId: string): Promise<void> {
        const platform = integration.integration_settings__platform;
        const service = this.platformServiceMap.get(platform);

        if (!service) {
            const error = new PropagatorException(`No service found for platform: ${platform}`, ExceptionCodeEnum.PROPAGATOR__GENERAL_ERR);
            this.logger.log(LoggerLevelEnum.WARN, new ErrorLog(error));
            return;
        }

        try {
            await service.deleteProduct(integration, productId);
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog(`Product removed from ${service.constructor.name}`));
        } catch (err) {
            const error = new PropagatorException(`Error removing product from ${platform}`, ExceptionCodeEnum.PROPAGATOR__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }
}
