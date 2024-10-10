export class HttpException extends Error {
	readonly name = 'HTTP EXCEPTION';
	readonly cause: unknown;

	constructor(
		readonly message: string,
		readonly httpCode: number,
		options?: { cause: unknown },
	) {
		super(message, {
			cause: options?.cause,
		});
		this.cause = options?.cause;
	}
}

