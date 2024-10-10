export interface WinstonInfo {
	message: string,
	level: string,
	name?: string,
	tags?: Record<string, string>,
	user?: object,
	error?: Error | {
		message?: string;
		name?: string;
		stack?: string;
	}

	[key: string]: unknown
}
