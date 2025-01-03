import {Router, Request, Response, NextFunction} from 'express';
import {Routes} from '../../main-router/routes.enum';
import {CheckService} from '../services/check.service';
import {HttpException} from '../../../exceptions/http.exception';

export class CheckRouter {
	private readonly checkRouter = Router();
	private readonly checkService = new CheckService();

	constructor() {
		this.checkRouter.get(`${Routes.V1}${Routes.CHECK}${Routes.PING}`, (req: Request, res: Response) => {
			res.status(200).send('pong');
		});

		this.checkRouter.get(`${Routes.V1}${Routes.CHECK}${Routes.TELEMETRY}`, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const telemetry = await this.checkService.getTelemetry();
				res.status(200).send(telemetry);
			} catch (err) {
				const error = new HttpException('Internal server error', 500, {cause: err});
				next(error);
			}
		});
	}

	public get router(): Router {
		return this.checkRouter;
	}
}
