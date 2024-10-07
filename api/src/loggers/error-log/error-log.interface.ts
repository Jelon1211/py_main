import {ExceptionCodeEnum} from '../../exceptions/exception-code.enum';
import {CustomException} from '../../exceptions/custom-exception.interface';

export interface IErrorLog {
	message: string; // Error message
	errorCode: ExceptionCodeEnum; // Code of error
	error: CustomException; // CustomError for this app
	errorDetails: string; // stringified full error with causes to catch full errors flow child-parent
	additionalData?: unknown; // Object with any additional data that cen help identify problem
	taskId?: string; // UUID of task if provided
}
