import { Express, Request, Response, NextFunction } from 'express';
import ConfigBuilder from '../../config-builder/config-builder';
import { Config } from '../../config-builder/config.interface';
import { HttpException } from '../../exceptions/http.exception';

export class AuthMiddleware {
  private readonly config: Config = ConfigBuilder.getConfig().config;

  constructor(private readonly app: Express) {}

  public init({ excludedRoutes }: { excludedRoutes: string[] }) {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (
        req.method === 'OPTIONS' ||
        excludedRoutes.includes(req.originalUrl)
      ) {
        return next();
      }

      const auth: string | undefined = req.headers.authorization;
      const token: string = `Bearer ${this.config.expressApi.authorizationToken}`;
      if (auth === token) {
        return next();
      }

      const error = new HttpException('Not authorized', 401);
      next(error);
    });
  }
}