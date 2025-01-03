import {CustomException} from './custom-exception.interface';
import {ExceptionCodeEnum} from './exception-code.enum';

export class PropagatorException extends Error implements CustomException {
	readonly name = 'PROPAGATOR EXCEPTION';
	readonly cause: unknown;
	alreadyLogged: boolean = false;

	constructor(
		readonly message: string,
		readonly errorCode: ExceptionCodeEnum,
		options?: { cause: unknown },
	) {
		super(message, {
			cause: options?.cause,
		});
		this.cause = options?.cause;
	}
}

