import {ExceptionCodeEnum} from './exception-code.enum';
import {CronTaskException} from './cron-task.exception';
import {QuotaTrimmed} from '../data-sources/sql/db-interfaces/quota-trimmed.interface';
import {CronErrorType} from './cron-error-type.enum';

export class CronTaskExceptionEnriched extends CronTaskException {

	constructor(
		message: string,
		errorCode: ExceptionCodeEnum,
		readonly element: QuotaTrimmed,
		readonly cronErrorType: CronErrorType,
		options?: { cause: unknown },
	) {
		super(message, errorCode, {
			cause: options?.cause,
		});
	}
}

