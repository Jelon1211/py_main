import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {NextFunction, Request, Response, Router} from "express";
import {BaseLinkerRoutes, OpenRoutes, Routes} from "../../main-router/routes.enum";
import {HttpException} from "../../../exceptions/http.exception";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {BaselinkerException} from "../../../exceptions/baselinker.exception";
import {BaselinkerService} from "../service/baselinker.service";
import {ProductPropagationService} from "../../base/service/product-propagation.service";

export class BaselinkerRouter {
    private readonly baselinkerRouter = Router();
    private readonly baselinkerService: BaselinkerService = new BaselinkerService();
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly productPropagationService: ProductPropagationService = ProductPropagationService.getInstance();

    constructor() {
        this.baselinkerRouter.head(`${Routes.V1}${OpenRoutes.PRODUCT}${OpenRoutes.SYNC}${BaseLinkerRoutes.BASELINKER}${OpenRoutes.INTEGRATIONKEY}`,
            async (req: Request, res: Response, next: NextFunction) => {
                try {

                    const integrationKey = req.params.integrationKey;
                    const productId = req.query.productId as string;

                    if (!productId) {
                        const error = new BaselinkerException('Product id is missing', 400);
                        this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                        return next(error);
                    }

                    const propagationObject = await this.baselinkerService.handleBaselinkerProductAction(productId, integrationKey)
                    await this.productPropagationService.propagateProduct(propagationObject)

                    res.status(200).end();
                } catch (err) {
                    const error = new HttpException('Internal server error', 500, {cause: err});
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                    next(error);
                }
            });

        this.baselinkerRouter.head(`${Routes.V1}${OpenRoutes.ORDER}${OpenRoutes.SYNC}${BaseLinkerRoutes.BASELINKER}${OpenRoutes.INTEGRATIONKEY}`,
            async (req: Request, res: Response, next: NextFunction) => {
                try {

                    const integrationKey = req.params.integrationKey;
                    const orderId = Array.isArray(req.query.orderId) ? req.query.orderId[0] : req.query.orderId;

                    if (!orderId) {
                        const error = new BaselinkerException('Order id is missing', 400);
                        this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                        return next(error);
                    }

                    await this.baselinkerService.handleBaselinkerOrder(integrationKey, orderId)

                    res.status(200).end();
                } catch (err) {
                    const error = new HttpException('Internal server error', 500, {cause: err});
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                    next(error);
                }
            });
    }

    public get router(): Router {
        return this.baselinkerRouter;
    }
}
