import {Router, Request, Response, NextFunction} from 'express';
import {HttpException} from '../../../exceptions/http.exception';

export class NotFoundRouter {
	private readonly notFoundRouter = Router();

	constructor() {
		this.notFoundRouter.all(`*`, (req: Request, res: Response, next: NextFunction) => {
			next(new HttpException('Not found', 404));
		});
	}

	public get router(): Router {
		return this.notFoundRouter;
	}
}
