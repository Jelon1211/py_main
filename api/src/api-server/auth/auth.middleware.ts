import { Express, Request, Response, NextFunction } from 'express';
import ConfigBuilder from '../../config-builder/config-builder';
import { Config } from '../../config-builder/config.interface';
import { HttpException } from '../../exceptions/http.exception';
import { match } from 'path-to-regexp';

export class AuthMiddleware {
	private readonly config: Config = ConfigBuilder.getConfig().config;

	constructor(private readonly app: Express) {
	}

	public init({
		excludedRoutes
	}: {
		excludedRoutes: string[]
	}) {
		this.app.use((req: Request, res: Response, next: NextFunction) => {
			const isExcluded = excludedRoutes.some((route) => {
				const matcher = match(route, {decode: decodeURIComponent});
				return matcher(req.originalUrl);
			});

			if (!isExcluded) {
				const auth: string | undefined = req.headers.authorization;
				const token: string = `Bearer ${this.config.expressApi.authorizationToken}`;

				if (!auth || auth !== token) {
					const error = new HttpException('Not authorized', 401);
					return next(error);
				}
			}
			next();
		});
	}
}
