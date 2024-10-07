import {WinstonInfo} from './interfaces/winston-info.interface';

export class DefaultError extends Error {
	constructor(info: WinstonInfo) {
		super(info.error?.message || info.message);

		this.name = info.error?.name || info.name || "Error";
		const stack = info.error?.stack || info.stack;
		if (stack && typeof stack === "string") {
			this.stack = stack;
		}
	}
}
