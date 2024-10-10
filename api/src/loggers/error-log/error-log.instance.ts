import {IErrorLog} from './error-log.interface';
import {ExceptionCodeEnum} from '../../exceptions/exception-code.enum';
import {CustomException} from '../../exceptions/custom-exception.interface';

export class ErrorLog implements IErrorLog {
	readonly message: string;
	readonly errorCode: ExceptionCodeEnum;
	readonly errorDetails: string;
	readonly cause: unknown;
	error: CustomException;

	constructor(error: CustomException, readonly additionalData?: unknown, readonly taskId?: string) {
		this.error = error;
		this.errorCode = error.errorCode;
		this.message = error.message;
		this.errorDetails = this.getSerializedError(error);
		this.cause = error.cause;
	}

	private getSerializedError(error: CustomException): string {
		return JSON.stringify(
			this.mapErrorToSerializableObject(error),
			this.errorReplacer,
		);
	}

	private mapErrorToSerializableObject(error: CustomException): object {
		return {
			name:      error.name,
			message:   error.message,
			errorCode: error.errorCode,
			cause:     error.cause,
		};
	}

	private errorReplacer = (key: string, value: unknown) => {
		if (value instanceof Error) {
			return {
				name:    value.name,
				message: value.message,
				stack:   value.stack,
				cause:   value.cause,
			};
		}
		return value;
	};
}
