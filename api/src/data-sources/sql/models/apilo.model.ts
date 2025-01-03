import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {MySqlDataSource} from "../sql-data-source";
import {v4 as uuidv4} from 'uuid';
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {SqlException} from "../../../exceptions/sql.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {InsertApiloTokenPayload, UpdateApiloTokenPayload} from "../../../api-server/apilo/interfaces";
import {MerchantRecord} from "../db-interfaces/merchant.interface";
import {GetIntegrationId} from "../../../api-server/integration/interfaces";


export class ApiloModel {
    private static instance: ApiloModel | null = null;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly mySqlDataSource: MySqlDataSource = MySqlDataSource.getInstance();

    private constructor() {
    }

    public static getInstance() {
        if (ApiloModel.instance) {
            return ApiloModel.instance;
        }
        return (ApiloModel.instance = new ApiloModel());
    }


    public async insertApiloToken(insertApiloTokenPayload: InsertApiloTokenPayload): Promise<{ token_uuid: string }> {
        try {
            const integrationQuery = `
            SELECT id
            FROM integration
            WHERE uuid = ?
            LIMIT 1
            `;
        const integrationRows = await this.mySqlDataSource.executeQuery<{id: number}[]>(integrationQuery, [insertApiloTokenPayload.integration_uuid]);

        if (integrationRows.length === 0) {
            const error = new SqlException('Integration not found', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }

        const integrationId = integrationRows[0].id;

        const tokenUuid = uuidv4();

        const insertQuery = `
            INSERT INTO integration_apilo_settings (
                integration_id,
                uuid,
                endpoint,
                client_secret,
                client_id,
                access_token,
                access_token_expire_at,
                refresh_token,
                refresh_token_expire_at,
                created,
                modified
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
        `;
        await this.mySqlDataSource.executeQuery(insertQuery, [
            integrationId,
            tokenUuid,
            insertApiloTokenPayload.endpoint,
            insertApiloTokenPayload.client_secret,
            insertApiloTokenPayload.client_id,
            insertApiloTokenPayload.access_token,
            insertApiloTokenPayload.access_token_expire_at,
            insertApiloTokenPayload.refresh_token,
            insertApiloTokenPayload.refresh_token_expire_at
        ]);

        return {token_uuid: tokenUuid};
    }
    catch (err) {
            const error = new SqlException('Failed inserting apilo token', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async getApiloToken(integrationUuid: string): Promise<{
        endpoint: string;
        access_token: string;
        access_token_expire_at: number;
        refresh_token: string;
        refresh_token_expire_at: number;
        uuid: string;
        client_secret: string;
        client_id: number;
    }> {
        try {
            const integrationQuery = `
		        SELECT id
		        FROM integration
		        WHERE uuid = ?
		        LIMIT 1
            `;

            const integrationRows = await this.mySqlDataSource.executeQuery<{ id: number }[]>(integrationQuery, [integrationUuid]);

            if (integrationRows.length === 0) {
                const error = new SqlException('Integration not found', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            const integrationId = integrationRows[0].id;

            const settingsQuery = `
        SELECT endpoint,
               access_token,
               access_token_expire_at,
               refresh_token,
               refresh_token_expire_at,
               uuid,
               client_secret,
               client_id
        FROM integration_apilo_settings
        WHERE integration_id = ?
    `;
            const settingsRows = await this.mySqlDataSource.executeQuery<{
                endpoint: string;
                access_token: string;
                access_token_expire_at: number;
                refresh_token: string;
                refresh_token_expire_at: number;
                uuid: string;
                client_secret: string;
                client_id: number;
            }[]>(settingsQuery, [integrationId]);

            if (settingsRows.length === 0) {
                const error = new SqlException('Error executing getApiloToken function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            const tokenData = settingsRows[0];

            return tokenData;
        }catch (err){
            const error = new SqlException('Error executing getApiloToken function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async updateApiloToken(updateApiloTokenPayload: UpdateApiloTokenPayload): Promise<{ rowCount: number }> {
        try {

                const tokenQuery = `
            SELECT id
            FROM integration_apilo_settings
            WHERE uuid = ?
            LIMIT 1
        `;
            const tokenRows = await this.mySqlDataSource.executeQuery<{ id: number }[]>(tokenQuery, [updateApiloTokenPayload.uuid]);

            if (tokenRows.length === 0) {
                const error = new SqlException('Token with the given UUID does not exist', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            const tokenId = tokenRows[0].id;

            const updateQuery = `
            UPDATE integration_apilo_settings
            SET 
                access_token = COALESCE(?, access_token),
                access_token_expire_at = COALESCE(?, access_token_expire_at),
                refresh_token = COALESCE(?, refresh_token),
                refresh_token_expire_at = COALESCE(?, refresh_token_expire_at),
                modified = UNIX_TIMESTAMP()
            WHERE id = ?
        `;

            const result = await this.mySqlDataSource.executeQuery<{ affectedRows: number }>(updateQuery, [
                updateApiloTokenPayload.accessToken,
                updateApiloTokenPayload.refreshTokenExpireAt,
                updateApiloTokenPayload.refreshToken,
                updateApiloTokenPayload.refreshTokenExpireAt,
                tokenId,
            ]);

            return {rowCount: result.affectedRows || 0};
        }catch(err) {
            const error = new SqlException('Error executing updateApiloToken function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async getAllIntegrationsByActiveApilo(): Promise<{ uuid: string }[] | []> {
        try {
            const integrationsQuery = `
            SELECT integration.uuid
            FROM integration
            JOIN integration_settings
                 ON integration.id = integration_settings.integration_id
            JOIN platform
                 ON integration_settings.platform_id = platform.id
            WHERE platform.name = 'Apilo'
              AND integration_settings.status = 'active';
        `;

            const integrationRows: {uuid: string}[] | [] = await this.mySqlDataSource.executeQuery<{uuid: string}[] | []>(integrationsQuery);

            return integrationRows;
        } catch (err) {
            const error = new SqlException('Error executing getAllIntegrationsByActiveApilo function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async checkOrderExists(integrationUuid: string, orderId: string): Promise<boolean> {
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

            return String(rows[0].external_id) === String(orderId);
        } catch (err) {
            const error = new SqlException('Failed executing checkOrderExists function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async insertOrder(integrationUuid: string, apiloOrderJson: string, orderId: string): Promise<{orderUuid: string}> {
        try {
            const integrationId = await this.getIntegrationIdByUuid(integrationUuid)

            const insertQuery =
                "INSERT INTO `order` (`integration_id`,`uuid`, `external_id`, `data`, `created`, `modified`) VALUES (?, ?, ?, ?, ?, ?)";
            const selectQuery = "SELECT `uuid` FROM `order` WHERE `uuid` = ?";

            const uuid = uuidv4();
            const timestamp = Math.floor(Date.now() / 1000);

            await this.mySqlDataSource.executeQuery(insertQuery, [integrationId, uuid, orderId, apiloOrderJson, timestamp, timestamp], true);

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
