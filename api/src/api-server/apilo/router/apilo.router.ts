import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {NextFunction, Request, Response, Router} from "express";
import {ApiloRoutes, OpenRoutes, Routes} from "../../main-router/routes.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {HttpException} from "../../../exceptions/http.exception";
import {ApiloException} from "../../../exceptions/apilo.exception";
import {ApiloService} from "../service/apilo.service";

export class ApiloRouter {
    private readonly apiloRouter = Router();
    private readonly apiloService: ApiloService = new ApiloService();
    private readonly logger: AppLogger = AppLogger.getInstance();

    constructor() {
        this.apiloRouter.get(`${Routes.V1}${OpenRoutes.ORDER}${OpenRoutes.SYNC}${ApiloRoutes.APILO}${OpenRoutes.INTEGRATIONKEY}`,
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const integrationKey = req.params.integrationKey;
                    const orderId = req.query.orderId as string;

                    if (!orderId) {
                        const error = new ApiloException('Order id is missing', 400);
                        this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                        return next(error);
                    }

                    await this.apiloService.handleApiloOrder(integrationKey, orderId)
                    res.status(200).end();
                } catch (err) {
                    const error = new HttpException('Internal server error', 500, {cause: err});
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                    next(error);
                }
            });
    }

    public get router(): Router {
        return this.apiloRouter;
    }
}
