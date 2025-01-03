import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {MySqlDataSource} from "../sql-data-source";
import {v4 as uuidv4} from 'uuid';
import {GetIntegrationId} from "../../../api-server/integration/interfaces";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {SqlException} from "../../../exceptions/sql.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {GetBaselinkerTokenRecord, UpsertBaselinkerTokenRecord} from "../db-interfaces/baselinker.interface";
import {MerchantRecord} from "../db-interfaces/merchant.interface";


export class BaselinkerModel {
    private static instance: BaselinkerModel | null = null;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly mySqlDataSource: MySqlDataSource = MySqlDataSource.getInstance();

    private constructor() {
    }

    public static getInstance() {
        if (BaselinkerModel.instance) {
            return BaselinkerModel.instance;
        }
        return (BaselinkerModel.instance = new BaselinkerModel());
    }

    public async upsertBaselinkerToken(integrationUuid: string, xblToken: string): Promise<UpsertBaselinkerTokenRecord> {
        try {
        const integrationId = await this.getIntegrationIdByUuid(integrationUuid)

        const integrationQuery = `
            SELECT uuid
            FROM integration_baselinker_settings
            WHERE integration_id = ?
            LIMIT 1
        `;
        const integrationRows = await this.mySqlDataSource.executeQuery<{ uuid: string }[]>(integrationQuery, [integrationId]);

        let tokenUuid: string = uuidv4();

        if (integrationRows.length === 0) {

            const insertQuery = `
                INSERT INTO integration_baselinker_settings (integration_id, uuid, xbl_token, created, modified)
                VALUES (?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
            `;
            await this.mySqlDataSource.executeQuery(insertQuery, [integrationId, tokenUuid, xblToken]);
        } else {
            tokenUuid = integrationRows[0].uuid;

            const updateQuery = `
                UPDATE integration_baselinker_settings
                SET xbl_token = ?, modified = UNIX_TIMESTAMP()
                WHERE integration_id = ?
            `;
            await this.mySqlDataSource.executeQuery(updateQuery, [xblToken, integrationId]);
        }

            return {token_uuid: tokenUuid};
        }catch (err){
            const error = new SqlException('Failed while executing function upsertBaselinkerToken.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async getBaseLinkerTokenByUuid(uuid: string): Promise<GetBaselinkerTokenRecord> {
        try {
            const integrationQuery = `
            SELECT id
            FROM integration
            WHERE uuid = ?
            LIMIT 1
        `;
            const integrationRows = await this.mySqlDataSource.executeQuery<{ id: number }[]>(integrationQuery, [uuid]);

            if (integrationRows.length === 0) {
                const error = new SqlException('Error on getBaseLinkerTokenByUuid length 0', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            const integrationId = integrationRows[0].id;

            const tokenQuery = `
            SELECT xbl_token as baselinker_token
            FROM integration_baselinker_settings
            WHERE integration_id = ?
            LIMIT 1
        `;
            const tokenRows = await this.mySqlDataSource.executeQuery<{baselinker_token: string}[]>(tokenQuery, [integrationId]);

            if (tokenRows.length === 0) {
                const error = new SqlException('Baselinker token not found', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            return {token_uuid: tokenRows[0].baselinker_token};
        } catch (err) {
            const error = new SqlException('Failed while executing getBaseLinkerTokenByUuid', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async checkOrderExists(integrationUuid: string, orderId: number): Promise<boolean> {
        try {
            const integrationId = await this.getIntegrationIdByUuid(integrationUuid)

            const orderQuery = `
		        SELECT external_id
		        FROM \`order\`
		        WHERE integration_id = ?
			      AND external_id = ?
            `;

            const rows = await this.mySqlDataSource.executeQuery<{external_id: number}[]>(orderQuery, [integrationId, orderId], true);

            if (rows.length === 0) {
                return false
            }

            return Number(rows[0].external_id) === Number(orderId);
        } catch (err) {
            const error = new SqlException('Failed executing checkOrderExists function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async insertOrder(integrationUuid: string, baselinkerOrderJson: string, orderId: number): Promise<{orderUuid: string}> {
        try {
            const integrationId = await this.getIntegrationIdByUuid(integrationUuid)

            const insertQuery =
                "INSERT INTO `order` (`integration_id`,`uuid`, `external_id`, `data`, `created`, `modified`) VALUES (?, ?, ?, ?, ?, ?)";
            const selectQuery = "SELECT `uuid` FROM `order` WHERE `uuid` = ?";

            const uuid = uuidv4();
            const timestamp = Math.floor(Date.now() / 1000);

            await this.mySqlDataSource.executeQuery(insertQuery, [integrationId, uuid, orderId, baselinkerOrderJson, timestamp, timestamp], true);

            const rows = await this.mySqlDataSource.executeQuery<MerchantRecord[] | []>(selectQuery, [uuid]);

            if (rows.length === 0) {
                const error = new SqlException('Failed to retrieve inserted order', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            return rows[0];
        } catch (err) {
            const error = new SqlException('Failed executing insertOrder function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async getIntegrationIdByUuid(integrationUuid: string): Promise<number> {
        try {
        const getIntegrationIdQuery = `
        SELECT id
        FROM integration
        WHERE uuid = ?
        LIMIT 1
    `;

            const integrationResult: GetIntegrationId[] | [] = await this.mySqlDataSource.executeQuery(getIntegrationIdQuery, [integrationUuid]);

            if (integrationResult.length === 0) {
                const error = new SqlException('Error on getIntegrationIdByUuid length 0', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }
            return integrationResult[0].id;
        }catch (err){
            const error = new SqlException('Failed while executing getIntegrationIdByUuid function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }
}
