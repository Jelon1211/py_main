import {Express, Request, Response, NextFunction} from 'express';
import ConfigBuilder from '../../config-builder/config-builder';
import {Config} from '../../config-builder/config.interface';
import {HttpException} from '../../exceptions/http.exception';
import {JwtPayload, JwtService} from "../../validation/utils/jwt.utils";
import {MerchantModel} from "../../data-sources/sql/models/merchant.model";
import {MerchantRecord} from "../../data-sources/sql/db-interfaces/merchant.interface";
import {match} from 'path-to-regexp';

export class JwtMiddleware {
    private readonly merchantModel: MerchantModel = MerchantModel.getInstance();
    private readonly config: Config = ConfigBuilder.getConfig().config;

    constructor(private readonly app: Express) {
    }

    public init({excludedRoutes}: { excludedRoutes: string[]; }) {
        this.app.use(async (req: Request, res: Response, next: NextFunction) => {
            const isExcluded = excludedRoutes.some((route) => {
                const matcher = match(route, {decode: decodeURIComponent});
                return matcher(req.originalUrl);
            });

            if (!isExcluded) {
                const jwtToken: string | undefined = req.query.jwt as string;

                if (!jwtToken) {
                    const error = new HttpException('JWT missing', 401);
                    return next(error);
                }

                try {
                    const payload: JwtPayload = JwtService.verifyToken(jwtToken, this.config.jwt.secret);

                    let merchant: MerchantRecord | null = await this.merchantModel.getMerchantByCompanyId(payload.companyId, payload.userId);

                    const isValidMerchant: boolean = merchant !== null &&
                        merchant.company_id === payload.companyId &&
                        merchant.user_id === payload.userId;

                    if (!isValidMerchant) {
                        merchant = await this.merchantModel.insertMerchant(payload.companyId, payload.userId);
                    }

                    if (!merchant) {
                        const error = new HttpException('Failed to fetch or create a valid merchant', 500);
                        return next(error);
                    }

                    req.merchant = merchant;
                } catch (err) {
                    const error = new HttpException('Could not process merchant data', 500, {cause: err});
                    return next(error);
                }
            }

            next();
        });
    }
}
