import {Config} from '../../config-builder/config.interface';
import ConfigBuilder from '../../config-builder/config-builder';
import {AppLogger} from '../../loggers/logger-service/logger.service';
import {CronJob} from 'cron';
import {LoggerLevelEnum} from '../../loggers/log-level/logger-level.enum';
import {ErrorLog} from '../../loggers/error-log/error-log.instance';
import {CronTaskException} from '../../exceptions/cron-task.exception';
import {ExceptionCodeEnum} from '../../exceptions/exception-code.enum';
import {ApiloModel} from "../../data-sources/sql/models/apilo.model";
import {InfoLog} from "../../loggers/info-log/info-log.instance";
import {ApiloService} from "../../api-server/apilo/service/apilo.service";
import {ProductPropagationService} from "../../api-server/base/service/product-propagation.service";

export class SyncApiloProductsJob {
    private readonly config: Config = ConfigBuilder.getConfig().config;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly apiloModel: ApiloModel = ApiloModel.getInstance();
    private readonly productPropagationService: ProductPropagationService = ProductPropagationService.getInstance();
    private readonly cronTime: string = this.config.cron.cronTimeSyncApiloProducts;
    private readonly timeZone: string = this.config.luxon.timezone;
    private readonly apiloService: ApiloService;

    constructor() {
        this.apiloService = new ApiloService()
    }

    public getCroneJob() {
        return new CronJob(
            this.cronTime,
            async () => {
                await this.taskRun();
            },
            null,
            false,
            this.timeZone);
    }

    private async taskRun() {
        try {
            const allApiloIntegrations = await this.getAllActiveApilloIntegrations();

            if (allApiloIntegrations.length > 0) {
                await this.propagateApiloProducts(allApiloIntegrations);
            }
        } catch (err) {
            const error = new CronTaskException('Cannot proceed a whole task for SyncApiloProductsJob', ExceptionCodeEnum.CRON_TASK__GENERAL_PROCEEDING_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            // SHOULD BE NOT THROWN, JUST LOG TO SENTRY
        }
    }

    private async propagateApiloProducts(allApiloIntegrations: { uuid: string }[]): Promise<void> {
        try {
            for (let apiloIntegration of allApiloIntegrations) {
                const apiloProducts = await this.apiloService.getApiloProducts(apiloIntegration.uuid);
                for (let apiloProduct of apiloProducts) {
                    const propagationObject = await this.apiloService.getApiloPropagationObject(apiloIntegration.uuid, apiloProduct);
                    const propagationResults = await this.productPropagationService.propagateProduct(propagationObject)
                    this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Product propagated:', {propagationData: propagationResults}));
                }

            }
        } catch (err) {
            const error = new CronTaskException('Error executing propagateApiloProducts function', ExceptionCodeEnum.CRON_TASK__GENERAL_PROCEEDING_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
        }

    }

    private async getAllActiveApilloIntegrations(): Promise<{ uuid: string }[] | []> {
        const integrationUuidList = await this.apiloModel.getAllIntegrationsByActiveApilo();
        if (integrationUuidList.length === 0) {
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('No Apilo integration to sync.'));
            return [];
        }

        return integrationUuidList;
    }


}
