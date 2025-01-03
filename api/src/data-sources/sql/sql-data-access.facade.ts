import {MySqlDataSource} from './sql-data-source';
import {AppLogger} from '../../loggers/logger-service/logger.service';
import {QuotaTrimmed} from './db-interfaces/quota-trimmed.interface';
import {SqlException} from '../../exceptions/sql.exception';
import {ExceptionCodeEnum} from '../../exceptions/exception-code.enum';
import {LoggerLevelEnum} from '../../loggers/log-level/logger-level.enum';
import {ErrorLog} from '../../loggers/error-log/error-log.instance';

export class SqlDataAccessFacade {
	private static instance: SqlDataAccessFacade | null = null;
	private readonly logger: AppLogger = AppLogger.getInstance();
	private readonly mySqlDataSource: MySqlDataSource = MySqlDataSource.getInstance();

	private constructor() {
	}

	public static getInstance() {
		if (SqlDataAccessFacade.instance) {
			return SqlDataAccessFacade.instance;
		}
		return (SqlDataAccessFacade.instance = new SqlDataAccessFacade());
	}

	public async getQuotaUuid(storedQuotaUuid: string) {
		try {
			const results: QuotaTrimmed[][] = await this.mySqlDataSource.executeQuery<QuotaTrimmed[][]>('CALL app_quota_check__quota__get_uuid(?)', [
				storedQuotaUuid
			]);
			return results[0];
		} catch (err) {
			const error = new SqlException('Failed while executing getQuotaUuid function.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
			this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
			throw error;
		}
	}

	public async insertQuotaNotifyAndCancelQuota(quotaUuid: string, quotaNotifyStatus: string) {
		try {
			const results: [][] = await this.mySqlDataSource.executeQuery<[][]>('CALL app_quota_check__quota__update(?,?)', [
				quotaUuid,
				quotaNotifyStatus,
			], true);
			return results[0];
		} catch (err) {
			const error = new SqlException('Failed while executing insertQuotaNotifyAndCancelQuota function.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
			this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
			throw error;
		}
	}

	public async updateQuotaNotify(quotaUuid: string, quotaNotifyStatus: string) {
		try {
			const results: [][] = await this.mySqlDataSource.executeQuery<[][]>('CALL app_quota_check__quota_notification__update(?,?)', [
				quotaUuid,
				quotaNotifyStatus,
			], true);
			return results[0];
		} catch (err) {
			const error = new SqlException('Failed while executing updateQuotaNotify function.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
			this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
			throw error;
		}
	}
}
