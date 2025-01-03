import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {NextFunction, Request, Response, Router} from "express";
import {EbiuroProxyRoutes, OpenRoutes, Routes} from "../../main-router/routes.enum";
import {HttpException} from "../../../exceptions/http.exception";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {ValidationMiddleware} from "../../../validation/middleware/validation.middleware";
import {ebiuroProxyDeleteProductSchema, ebiuroProxyProductSchema} from "../schema/ebiuro-proxy.schema";
import {EbiuroProxyService} from "../service/ebiuro-proxy.service";
import {StatusHttp} from "../../integration/enums";
import {ProductPropagationService} from "../../base/service/product-propagation.service";
import {DeleteProductRequest, EbiuroProxyProduct} from "../intergace";

export class EbiuroProxyRouter {
    private readonly ebiuroProxyRouter = Router();
    private readonly ebiuroProxyService: EbiuroProxyService = new EbiuroProxyService();
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly productPropagationService: ProductPropagationService = ProductPropagationService.getInstance();

    constructor() {
        this.ebiuroProxyRouter.post(`${Routes.V1}${EbiuroProxyRoutes.PRODUCT}${OpenRoutes.SYNC}${EbiuroProxyRoutes.EBIUROPROXY}`,
            // eslint-disable-next-line no-warning-comments
            // TODO: prepare product schema
            ValidationMiddleware.validate(ebiuroProxyProductSchema),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const {product}: EbiuroProxyProduct = req.body as EbiuroProxyProduct
                    const merchant = req.merchant

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    const propagationObject = await this.ebiuroProxyService.getEbiuroProxyProductPropagateObject(merchant, product);
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

        this.ebiuroProxyRouter.delete(`${Routes.V1}${EbiuroProxyRoutes.PRODUCT}${OpenRoutes.SYNC}${EbiuroProxyRoutes.EBIUROPROXY}`,
            ValidationMiddleware.validate(ebiuroProxyDeleteProductSchema),
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const {productId} = req.body as DeleteProductRequest
                    const merchant = req.merchant

                    const deletionObject = await this.ebiuroProxyService.getEbiuroProxyProductDeletionObject(merchant, productId)
                    const deletionResults = await this.productPropagationService.removeProduct(deletionObject)

                    res.status(200).send({
                        status: StatusHttp.SUCCESS,
                        data: deletionResults
                    })
                } catch (err) {
                    const error = new HttpException('Internal server error', 500, {cause: err});
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                    next(error);
                }
            });
    }

    public get router(): Router {
        return this.ebiuroProxyRouter;
    }
}
