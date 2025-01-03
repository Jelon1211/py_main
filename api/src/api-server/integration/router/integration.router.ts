import {Router, Request, Response, NextFunction} from 'express';
import {ApiloRoutes, BaseLinkerRoutes, IntegrationRoutes, Routes} from '../../main-router/routes.enum';
import {HttpException} from "../../../exceptions/http.exception";
import {IntegrationService} from "../serivce/integration.service";
import {CheckIntegrationPayload, CreateIntegrationPayload, InitBaseLinkerIntegrationPayload, Integration, UpdateIntegrationPayload, UpdateIntegrationStatusPayload} from "../interfaces";
import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {Merchant} from "../../../config-builder/config.interface";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ValidationMiddleware} from "../../../validation/middleware/validation.middleware";
import {
    checkIntegrationSchema,
    createIntegrationSchema,
    deleteIntegrationSchema,
    initApiloIntegrationSchema,
    initBaseLinkerIntegrationSchema,
    patchIntegrationSchema,
    putIntegrationSchema
} from "../schema/integration.schema";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {InitApiloPayload} from "../../apilo/interfaces";
import {ApiloService} from "../../apilo/service/apilo.service";
import {ValidateUtils} from "../../../validation/utils/validate.utils";
import {getRestApiloTokenSchema, pingApiloSchema} from "../../apilo/schema/apilo.schema";

export class IntegrationRouter {
    private readonly integrationRouter = Router();
    private readonly integrationService = new IntegrationService();
    private readonly apiloService = new ApiloService();
    private readonly logger: AppLogger = AppLogger.getInstance();

    constructor() {
        this.integrationRouter.get(`${Routes.V1}${Routes.INTEGRATION}${IntegrationRoutes.INTEGRATION}`,async (req: Request, res: Response, next: NextFunction) => {
            try {
                const merchant = req.merchant

                const integrationList: Integration[] | [] = await this.integrationService.getIntegrations(merchant);
                res.status(200).send(integrationList)
            } catch (err) {
                const error = new HttpException('Internal server error', 500, {cause: err});
                next(error);
            }
        });

        this.integrationRouter.post(`${Routes.V1}${Routes.INTEGRATION}${IntegrationRoutes.INTEGRATION}`,
            ValidationMiddleware.validate(createIntegrationSchema),
            async (req: Request, res: Response, next: NextFunction) => {
            try {
                const merchantUuid = req.merchant.uuid;
                const {platform, integrationName, siteUrl, xblToken} = req.body as CreateIntegrationPayload;

                const createIntegrationObject: CreateIntegrationPayload = {merchantUuid, platform, integrationName, siteUrl, xblToken}

                const integration = await this.integrationService.createIntegration(createIntegrationObject);
                res.status(200).send(integration)
            } catch (err) {
                const error = new HttpException('Internal server error', 500, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                next(error);
            }
        });

        this.integrationRouter.put(`${Routes.V1}${Routes.INTEGRATION}${IntegrationRoutes.INTEGRATION}`,
            ValidationMiddleware.validate(putIntegrationSchema),
            async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    uuid,
                    integrationName,
                    platform,
                    siteUrl,
                    xblToken,
                    status,
                    isDeleted,
                    invoiceStatusTrigger,
                    invoiceNumbering,
                    receiptNumbering,
                    warehouse,
                    productGroup,
                    priceGroup,
                    syncDirection,
                    inventorySync
                } = req.body as UpdateIntegrationPayload

                const updateIntegrationObject: UpdateIntegrationPayload = {uuid, integrationName, platform, siteUrl, xblToken, status, isDeleted, invoiceStatusTrigger, invoiceNumbering, receiptNumbering, warehouse, productGroup, priceGroup, syncDirection, inventorySync}

                const integration = await this.integrationService.updateIntegration(updateIntegrationObject);
                res.status(200).send(integration)
            } catch (err) {
                const error = new HttpException('Internal server error', 500, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                next(error);
            }
        });

        this.integrationRouter.patch(`${Routes.V1}${Routes.INTEGRATION}${IntegrationRoutes.INTEGRATION}`,
            ValidationMiddleware.validate(patchIntegrationSchema),
            async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    uuid,
                    status,
                } = req.body as UpdateIntegrationStatusPayload

                const updateIntegrationStatusObject: UpdateIntegrationStatusPayload = {uuid, status}

                const integration = await this.integrationService.updateIntegrationStatus(updateIntegrationStatusObject);
                res.status(200).send(integration)
            } catch (err) {
                const error = new HttpException('Internal server error', 500, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                next(error);
            }
        });

        this.integrationRouter.delete(`${Routes.V1}${Routes.INTEGRATION}${IntegrationRoutes.INTEGRATION}`,
            ValidationMiddleware.validate(deleteIntegrationSchema),
            async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    uuid,
                } = req.body as {uuid: string}

                const integration = await this.integrationService.deleteIntegration(uuid);
                res.status(200).send(integration)
            } catch (err) {
                const error = new HttpException('Internal server error', 500, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                next(error);
            }
        });

        this.integrationRouter.post(`${Routes.V1}${Routes.INTEGRATION}${IntegrationRoutes.CHECK}`,
            ValidationMiddleware.validate(checkIntegrationSchema),
            async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    uuid,
                    siteUrl,
                    platform
                } = req.body as CheckIntegrationPayload

                const checkIntegrationPayload: CheckIntegrationPayload = {uuid, siteUrl, platform}

                const integration = await this.integrationService.checkIntegration(checkIntegrationPayload);
                res.status(200).send(integration)
            } catch (err) {
                const error = new HttpException('Internal server error', 500, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                next(error);
            }
        });

        this.integrationRouter.post(`${Routes.V1}${Routes.INTEGRATION}${Routes.BASELINKER}${BaseLinkerRoutes.INIT}`,
            ValidationMiddleware.validate(initBaseLinkerIntegrationSchema),
            async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    uuid,
                    platform,
                    xblToken,
                } = req.body as InitBaseLinkerIntegrationPayload

                const initBaseLinkerIntegrationPayload: InitBaseLinkerIntegrationPayload = {uuid, platform, xblToken}

                const integration = await this.integrationService.initBaseLinkerIntegration(initBaseLinkerIntegrationPayload);
                res.status(200).send(integration)
            } catch (err) {
                const error = new HttpException('Internal server error', 500, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                next(error);
            }
        });

        this.integrationRouter.post(`${Routes.V1}${Routes.INTEGRATION}${Routes.APILO}${ApiloRoutes.INIT}`,
            ValidationMiddleware.validate(initApiloIntegrationSchema),
            async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    uuid,
                    apiEndpoint,
                    clientId,
                    clientSecret,
                    authCode,
                } = req.body as InitApiloPayload

                const initApiloPayload: InitApiloPayload = {uuid, apiEndpoint, clientId, clientSecret, authCode}

                await this.apiloService.initApilo(initApiloPayload);
                const pingApilo = await this.apiloService.pingApilo(initApiloPayload.apiEndpoint, initApiloPayload.uuid)
                ValidateUtils.validate(pingApilo, pingApiloSchema)
                res.status(200).send(pingApilo)
            } catch (err) {
                const error = new HttpException('Internal server error', 500, {cause: err});
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                next(error);
            }
        });
    }

    public get router(): Router {
        return this.integrationRouter;
    }
}
