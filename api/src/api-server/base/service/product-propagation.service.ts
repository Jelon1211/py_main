import {Propagator} from "../propagator";
import {PrestaService} from "../../prestashop/service/presta.service";
import {WoocommerceService} from "../../woocommerce/service/woocommerce.service";
import {DeletionObject, PropagationObject, PropagatorProductResponse} from "../interfaces";
import {ApiloService} from "../../apilo/service/apilo.service";
import {BaselinkerService} from "../../baselinker/service/baselinker.service";
import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {StatusHttp} from "../../integration/enums";

export class ProductPropagationService {
    private static instance: ProductPropagationService | null = null;
    private readonly logger: AppLogger = AppLogger.getInstance();

    private readonly propagator: Propagator = new Propagator([
        new PrestaService(),
        new WoocommerceService(),
        new ApiloService(),
        new BaselinkerService(),
    ]);

    public static getInstance() {
        if (ProductPropagationService.instance) {
            return ProductPropagationService.instance;
        }
        return (ProductPropagationService.instance = new ProductPropagationService());
    }


    public async propagateProduct(propagationObject: PropagationObject): Promise<PropagatorProductResponse[]> {
        const results: PropagatorProductResponse[] = []

        for (const integration of propagationObject.integrations) {
            try {
                await this.propagator.propagateProduct(
                    integration,
                    propagationObject.canonicalProduct
                );
                results.push({
                    platform: integration.integration_settings__platform,
                    name: integration.integration__name,
                    status: StatusHttp.SUCCESS
                });
            } catch (err) {
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                results.push({
                    platform: integration.integration_settings__platform,
                    name: integration.integration__name,
                    status: StatusHttp.ERROR,
                    error: JSON.stringify(err)
                });
            }
        }

        return results;
    }

    public async removeProduct(deletionObject: DeletionObject): Promise<PropagatorProductResponse[]> {
        const results: PropagatorProductResponse[] = []

        for (const integration of deletionObject.integrations) {
            try {
                await this.propagator.removeProduct(
                    integration,
                    deletionObject.productId
                );
                results.push({
                    platform: integration.integration_settings__platform,
                    name: integration.integration__name,
                    status: StatusHttp.SUCCESS
                });
            } catch (err) {
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                results.push({
                    platform: integration.integration_settings__platform,
                    name: integration.integration__name,
                    status: StatusHttp.ERROR,
                    error: JSON.stringify(err)
                });
            }
        }

        return results;
    }

}
