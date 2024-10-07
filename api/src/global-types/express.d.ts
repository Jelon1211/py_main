declare namespace Express {
	export interface Request {
		api?: { requestId: string };
	}
}
