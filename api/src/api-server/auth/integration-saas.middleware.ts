import {Express, Request, Response, NextFunction} from 'express';
import {HttpException} from '../../exceptions/http.exception';
import {IntegrationModel} from "../../data-sources/sql/models/integration.model";
import {Integration} from "../integration/interfaces";
import {IntegrationStatusEnum} from "../integration/enums";
import {match} from 'path-to-regexp';

export class IntegrationSaasMiddleware {
    private readonly integrationModel: IntegrationModel = IntegrationModel.getInstance();

    constructor(private readonly app: Express) {
    }

    public init({includedRoutes}: { includedRoutes: string[] }) {
        this.app.use(async (req: Request, res: Response, next: NextFunction) => {
            const urlWithoutQuery = req.originalUrl.split('?')[0];
            const isIncluded = includedRoutes.some((route) => {
                const matcher = match(route, {decode: decodeURIComponent});
                const matched = matcher(urlWithoutQuery);

                if (matched) {
                    req.params.integrationKey = matched.params.integrationKey as string;
                    return true;
                }
                return false;
            });

            if (isIncluded) {
                const integrationKey: string | undefined = req.params.integrationKey;

                if (!integrationKey) {
                    const error = new HttpException('integrationKey missing in URL', 401);
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
