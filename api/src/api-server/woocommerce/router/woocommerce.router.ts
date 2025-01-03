import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {NextFunction, Request, Response, Router} from "express";
import {WoocommerceService} from "../service/woocommerce.service";
import {OpenRoutes, Routes, WoocommerceRoutes} from "../../main-router/routes.enum";
import {ValidationMiddleware} from "../../../validation/middleware/validation.middleware";
import {HttpException} from "../../../exceptions/http.exception";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {woocommerceOrderSchema, woocommerceProductSchema} from "../schema/woocommerce.schema";
import {ProductPropagationService} from "../../base/service/product-propagation.service";
import {StatusHttp} from "../../integration/enums";
import {WoocommerceOrder, WoocommerceProduct} from "../interfaces";

export class WoocommerceRouter {
    private readonly woocommerceRouter: Router = Router();
    private readonly woocommerceService: WoocommerceService = new WoocommerceService();
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly productPropagationService: ProductPropagationService = ProductPropagationService.getInstance();


    constructor() {
        this.woocommerceRouter.post(`${Routes.V1}${OpenRoutes.PRODUCT}${OpenRoutes.SYNC}${WoocommerceRoutes.WOOCOMMERCE}`,
            ValidationMiddleware.validate(woocommerceProductSchema),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const integrationUuid: string = req.header('X-Integration-Key') as string;
                    const wooProduct = req.body as WoocommerceProduct

                    const propagationObject = await this.woocommerceService.getWoocommerceProductPropagateObject(integrationUuid, wooProduct);
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

        this.woocommerceRouter.post(`${Routes.V1}${OpenRoutes.ORDER}${OpenRoutes.SYNC}${WoocommerceRoutes.WOOCOMMERCE}`,
            ValidationMiddleware.validate(woocommerceOrderSchema),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const integrationUuid: string = req.header('X-Integration-Key') as string;
                    const wooOrder = req.body as WoocommerceOrder

                    if (!wooOrder.order_id) {
                        const error = new HttpException('Missing order id', 500);
                        return next(error);
                    }

                    const orderHandlerResponse = await this.woocommerceService.handleWoocommerceOrder(integrationUuid, wooOrder)


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
        return this.woocommerceRouter;
    }
}
