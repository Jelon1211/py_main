import { v4 } from 'uuid';
import { Express, Request, Response, NextFunction } from 'express';

export class SecurityHelpers {
  constructor(private readonly app: Express) {}

  public setSecureHeaders() {
    this.app.disable('x-powered-by');
    this.app.disable('etag');
    this.app.enable('trust proxy');
  }

  public initSecureHeadersMiddleware() {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.api = {
        requestId: v4(),
      };

      res.header('X-Frame-Options', 'SAMEORIGIN; SAMEORIGIN');
      res.header('X-Xss-Protection', '1; mode=block');
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Request-Id', req.api.requestId);
      res.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );

      res.set('Connection', 'close');
      next();
    });
  }
}
