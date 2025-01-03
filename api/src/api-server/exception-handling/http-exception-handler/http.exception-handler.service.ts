import {Express, NextFunction, Request, Response} from 'express';
import {HttpException} from '../../../exceptions/http.exception';

export class HttpExceptionHandlerService {
	constructor(private readonly app: Express) {
	}

	public init(): void {
		this.app.use(
			(
				error: Error,
				req: Request,
				res: Response,
				next: NextFunction,
			): void => {
				if (error instanceof HttpException) {
					res.status(error.httpCode).json({
						ok:    false,
						error: {
							message: error.message,
							code:    error.httpCode
						},
					});
				}
			},
		);
	}
}

