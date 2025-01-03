import {v4 as uuidv4} from "uuid";
import {MySqlDataSource} from "../sql-data-source";
import {MerchantRecord, MerchantUuid} from "../db-interfaces/merchant.interface"
import {SqlException} from "../../../exceptions/sql.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {AppLogger} from "../../../loggers/logger-service/logger.service";

export class MerchantModel {
    private static instance: MerchantModel | null = null;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly mySqlDataSource: MySqlDataSource = MySqlDataSource.getInstance();

    private constructor() {
    }

    public static getInstance() {
        if (MerchantModel.instance) {
            return MerchantModel.instance;
        }
        return (MerchantModel.instance = new MerchantModel());
    }

    public async getMerchantByCompanyId(companyId: string, userId: string): Promise<MerchantRecord | null> {
        try {
            const query = "SELECT `uuid`, `company_id`, `user_id` FROM `merchant` WHERE `company_id` = ? AND `user_id` = ? LIMIT 1";
            const rows = await this.mySqlDataSource.executeQuery<MerchantRecord[]>(query, [companyId, userId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (err) {
            const error = new SqlException('Failed while executing getMerchantByCompanyId function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async getMerchantByIntegrationUuid(integrationUuid: string): Promise<MerchantUuid> {
        try {
            const query = `
        SELECT merchant.uuid 
        FROM merchant
        INNER JOIN integration 
        ON integration.merchant_id = merchant.id
        WHERE integration.uuid = ?
        LIMIT 1
    `;
            const rows = await this.mySqlDataSource.executeQuery<MerchantRecord[] | []>(query, [integrationUuid]);

            if (rows.length === 0) {
                const error = new SqlException('Failed to retrieve merchant', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }
            return rows[0];

        } catch (err) {
            const error = new SqlException('Failed while executing getMerchantByIntegrationUuid function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async insertMerchant(companyId: string, userId: string): Promise<MerchantRecord> {
        try {
        const insertQuery =
            "INSERT INTO `merchant` (`uuid`, `company_id`, `user_id`, `created`, `modified`) VALUES (?, ?, ?, ?, ?)";
        const selectQuery = "SELECT uuid, company_id, user_id, created, modified FROM merchant WHERE uuid = ?";

            const uuid = uuidv4();
            const timestamp = Math.floor(Date.now() / 1000);

            await this.mySqlDataSource.executeQuery(insertQuery, [uuid, companyId, userId, timestamp, timestamp], true);

            const rows = await this.mySqlDataSource.executeQuery<MerchantRecord[] | []>(selectQuery, [uuid]);

            if (rows.length === 0) {
                const error = new SqlException('Failed to retrieve inserted merchant', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            return rows[0];
        } catch (err) {
            const error = new SqlException('Failed executing insertMerchant function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }
}
