import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {NextFunction, Request, Response, Router} from "express";
import {OpenRoutes, PrestaRoutes, Routes} from "../../main-router/routes.enum";
import {ValidationMiddleware} from "../../../validation/middleware/validation.middleware";
import {HttpException} from "../../../exceptions/http.exception";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {ProductPropagationService} from "../../base/service/product-propagation.service";
import {StatusHttp} from "../../integration/enums";
import {PrestaService} from "../service/presta.service";
import {prestaProductSchema} from "../schema/prestashop.schema";
import {woocommerceOrderSchema} from "../../woocommerce/schema/woocommerce.schema";
import {WoocommerceOrder} from "../../woocommerce/interfaces";
import {PrestaProduct} from "../interfaces";

export class PrestaRouter {
    private readonly prestaRouter: Router = Router();
    private readonly prestaService: PrestaService = new PrestaService();
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly productPropagationService: ProductPropagationService = ProductPropagationService.getInstance();

    constructor() {
        this.prestaRouter.post(`${Routes.V1}${OpenRoutes.PRODUCT}${OpenRoutes.SYNC}${PrestaRoutes.PRESTA}`,
            ValidationMiddleware.validate(prestaProductSchema),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const integrationUuid: string = req.header('X-Integration-Key') as string;
                    const prestaProduct = req.body as PrestaProduct;

                    const propagationObject = await this.prestaService.getPrestaProductPropagateObject(integrationUuid, prestaProduct);
                    const propagationResults = await this.productPropagationService.propagateProduct(propagationObject)

                    res.status(200).send({
                        status: StatusHttp.SUCCESS,
                        data: propagationResults
                    })
                } catch (err) {
                    const error = new HttpException('Internal server error', 500, {cause: err});
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                    next(error);
                }
            });

        this.prestaRouter.post(`${Routes.V1}${OpenRoutes.ORDER}${OpenRoutes.SYNC}${PrestaRoutes.PRESTA}`,
            ValidationMiddleware.validate(woocommerceOrderSchema),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    // eslint-disable-next-line no-warning-comments
                    // TODO: add schema for presta order
                    const integrationUuid: string = req.header('X-Integration-Key') as string;
                    const prestaOrder = req.body as WoocommerceOrder

                    if (!prestaOrder.order_id) {
                        const error = new HttpException('Missing order id', 500);
                        return next(error);
                    }

                    const orderHandlerResponse = await this.prestaService.handlePrestaOrder(integrationUuid, prestaOrder)

                    res.status(200).send({
                        status: StatusHttp.SUCCESS,
                        data: orderHandlerResponse
                    })
                } catch (err) {
                    const error = new HttpException('Internal server error', 500, {cause: err});
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                    next(error);
                }
            });
    }

    public get router(): Router {
        return this.prestaRouter;
    }
}
