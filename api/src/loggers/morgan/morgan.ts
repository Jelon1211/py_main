import {Express} from 'express';
import morgan from 'morgan';
import {ExpressStream} from '../logger-service/express-stream.interface';

export class Morgan {
	private readonly format = '[:res[X-Request-Id]] :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

	constructor(private readonly app: Express, private readonly expressStream: ExpressStream) {
	}

	public init(skipRoutes: string[]) {
		this.app.use(morgan(this.format, {
			stream: this.expressStream,
			skip:   (req) => skipRoutes.includes(req.originalUrl),
		}));
	}

}
