import {Express, Request, Response, NextFunction} from 'express';
import {HttpException} from '../../exceptions/http.exception';
import {IntegrationModel} from "../../data-sources/sql/models/integration.model";
import {Integration} from "../integration/interfaces";
import {IntegrationStatusEnum} from "../integration/enums";

export class IntegrationEcommerceMiddleware {
    private readonly integrationModel: IntegrationModel = IntegrationModel.getInstance();

    constructor(private readonly app: Express) {
    }

    public init({includedRoutes}: { includedRoutes: string[] }) {
        this.app.use(async (req: Request, res: Response, next: NextFunction) => {
            if (includedRoutes.some((route) => req.originalUrl.startsWith(route))) {
                const integrationKey: string | undefined = req.header('X-Integration-Key');

                if (!integrationKey) {
                    const error = new HttpException('X-Integration-Key missing', 401);
                    return next(error);
                }

                try {
                    const integration: Integration = await this.integrationModel.getIntegrationByUuid(integrationKey);

                    if (!integration || integration.integration_settings__status !== IntegrationStatusEnum.ACTIVE) {
                        const error = new HttpException('Invalid or inactive integration', 403);
                        return next(error);
                    }

                } catch (err) {
                    const error = new HttpException('Failed to process integration data', 500, {cause: err});
                    return next(error);
                }
            }

            next();
        });
    }
}
