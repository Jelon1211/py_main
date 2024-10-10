import {Express, Router} from 'express';

export class MainRouter {
	private readonly router = Router();

	constructor(private readonly app: Express) {
	}

	public init(routers: Router[]): void {
		routers.forEach((router: Router) => {
			this.router.use(router);
		});

		this.app.use(this.router);
	}

}
