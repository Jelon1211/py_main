import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {MySqlDataSource} from "../sql-data-source";
import {v4 as uuidv4} from 'uuid';
import {SqlException} from "../../../exceptions/sql.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {GetIntegrationId, GetMerchant, Integration, IntegrationCount, UpdatedIntegrationRecord} from "../../../api-server/integration/interfaces";
import {InsertIntegrationRecord} from "../db-interfaces/integration.interface";

export class IntegrationModel {
    private static instance: IntegrationModel | null = null;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly mySqlDataSource: MySqlDataSource = MySqlDataSource.getInstance();

    private constructor() {
    }

    public static getInstance() {
        if (IntegrationModel.instance) {
            return IntegrationModel.instance;
        }
        return (IntegrationModel.instance = new IntegrationModel());
    }
    public async getIntegrations(merchantUuid: string, offset: number, limit: number): Promise<Integration[] | []> {
        try {
            const merchantId = await this.getMerchantIdByUuid(merchantUuid);

            const getIntegrationsQuery = `
            SELECT 
                integration.uuid AS integration__uuid,
                integration.name AS integration__name,
                platform.name AS integration_settings__platform,
                integration_settings.status AS integration_settings__status,
                integration_settings.site_url AS integration_settings__site_url
            FROM integration
            LEFT JOIN integration_settings
                ON integration_settings.integration_id = integration.id
            LEFT JOIN platform
                ON integration_settings.platform_id = platform.id
            WHERE integration.merchant_id = ?
              AND integration_settings.is_deleted = 0
            LIMIT ? OFFSET ?
        `;
            const integrations: Integration[] | [] = await this.mySqlDataSource.executeQuery(getIntegrationsQuery, [merchantId, limit, offset]);

            return integrations;
        } catch (err) {
            const error = new SqlException('Failed while executing getIntegrations function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async getIntegrationByUuid(integrationUuid: string): Promise<Integration> {
        try {
            const getIntegrationQuery = `
            SELECT 
                integration.uuid AS integration__uuid,
                integration.name AS integration__name,
                platform.name AS integration_settings__platform,
                integration_settings.status AS integration_settings__status,
                integration_settings.site_url AS integration_settings__site_url
            FROM integration
            LEFT JOIN integration_settings
                ON integration_settings.integration_id = integration.id
            LEFT JOIN platform
                ON integration_settings.platform_id = platform.id
            WHERE integration.uuid = ?
              AND integration_settings.is_deleted = 0
        `;
            const integration: Integration[] | [] = await this.mySqlDataSource.executeQuery(getIntegrationQuery, [integrationUuid]);

            if (integration.length > 0) {
                return integration[0];
            }
            const error = new SqlException('Integration not found', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        } catch (err) {
            const error = new SqlException('Failed while executing getIntegrationByUuid function', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async insertIntegration(merchantUuid: string, integrationName: string, platform: string, siteUrl: string | null): Promise<InsertIntegrationRecord> {
        try {
            const merchantId = await this.getMerchantIdByUuid(merchantUuid);

            const platformQuery = `
            SELECT id
            FROM platform
            WHERE name = ?
            LIMIT 1
        `;
            const platformRows = await this.mySqlDataSource.executeQuery<{id: number}[]>(platformQuery, [platform]);

            if (platformRows.length === 0) {
                const error = new SqlException(`Platform '${platform}' not found`, ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            const platformId = platformRows[0].id;
            const integrationUuid = uuidv4();
            const settingsUuid = uuidv4();

            const insertIntegrationQuery = `
            INSERT INTO integration (merchant_id, uuid, name, created, modified)
            VALUES (?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
        `;
            const insertSettingsQuery = `
            INSERT INTO integration_settings (integration_id, uuid, platform_id, site_url, created, modified)
            VALUES (LAST_INSERT_ID(), ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
        `;

            await this.mySqlDataSource.executeQuery('START TRANSACTION', [], true);
            await this.mySqlDataSource.executeQuery(insertIntegrationQuery, [merchantId, integrationUuid, integrationName], true);
            await this.mySqlDataSource.executeQuery(insertSettingsQuery, [settingsUuid, platformId, siteUrl], true);
            await this.mySqlDataSource.executeQuery('COMMIT', [], true);

            return {integration_uuid: integrationUuid};
        } catch (err) {
            await this.mySqlDataSource.executeQuery('ROLLBACK', [], true);
            const error = new SqlException('Failed while executing insertIntegration function.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async updateIntegration(uuid: string, name: string | null, platform: string | null, siteUrl: string | null, status: string | null, isDeleted: number | null, invoiceStatusTrigger: string | null, invoiceNumbering: string | null, receiptNumbering: string | null, warehouse: string | null, productGroup: string | null, priceGroup: string | null, syncDirection: string | null): Promise<UpdatedIntegrationRecord | null> {
        try {
            const getIntegrationIdQuery = `
            SELECT id
            FROM integration
            WHERE uuid = ?
            LIMIT 1
        `;
            const integrationResult: GetIntegrationId[] | [] = await this.mySqlDataSource.executeQuery(getIntegrationIdQuery, [uuid]);

            if (integrationResult.length === 0) {
                const error = new SqlException('Error on updateIntegration length 0.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }
            const integrationId = integrationResult[0].id;

            let platformId: number | null = null;
            if (platform) {
                const platformQuery = `
                SELECT id
                FROM platform
                WHERE name = ?
                LIMIT 1
            `;
                const platformRows = await this.mySqlDataSource.executeQuery<{id: number}[]>(platformQuery, [platform]);
                if (platformRows.length === 0) {
                    const error = new SqlException(`Platform '${platform}' not found`, ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                    throw error;
                }
                platformId = platformRows[0].id;
            }

            const updateIntegrationQuery = `
            UPDATE integration
            SET name = IFNULL(?, name),
                modified = UNIX_TIMESTAMP()
            WHERE uuid = ?
        `;
            await this.mySqlDataSource.executeQuery(updateIntegrationQuery, [name, uuid], true);

            const updateSettingsQuery = `
            UPDATE integration_settings
            SET platform_id = IFNULL(?, platform_id),
                site_url = IFNULL(?, site_url),
                status = IFNULL(?, status),
                is_deleted = IFNULL(?, is_deleted),
                invoice_status_trigger = IFNULL(?, invoice_status_trigger),
                invoice_numbering = IFNULL(?, invoice_numbering),
                receipt_numbering = IFNULL(?, receipt_numbering),
                warehouse = IFNULL(?, warehouse),
                product_group = IFNULL(?, product_group),
                price_group = IFNULL(?, price_group),
                sync_direction = IFNULL(?, sync_direction),
                modified = UNIX_TIMESTAMP()
            WHERE integration_id = ?
        `;
            await this.mySqlDataSource.executeQuery(
                updateSettingsQuery,
                [
                    platformId,
                    siteUrl,
                    status,
                    isDeleted,
                    invoiceStatusTrigger,
                    invoiceNumbering,
                    receiptNumbering,
                    warehouse,
                    productGroup,
                    priceGroup,
                    syncDirection,
                    integrationId,
                ],
                true
            );

            const getUpdatedIntegrationQuery = `
            SELECT 
                integration.uuid AS integration__uuid,
                integration_settings.status AS integration_settings__status,
                platform.name AS integration_settings__platform,
                integration_settings.site_url AS integration_settings__site_url
            FROM integration
            LEFT JOIN integration_settings
                ON integration_settings.integration_id = integration.id
            LEFT JOIN platform
                ON integration_settings.platform_id = platform.id
            WHERE integration.uuid = ?
        `;
            const updatedIntegration: UpdatedIntegrationRecord[] | [] = await this.mySqlDataSource.executeQuery(getUpdatedIntegrationQuery, [uuid]);

            return updatedIntegration.length > 0 ? updatedIntegration[0] : null;
        } catch (err) {
            const error = new SqlException('Failed while executing updateIntegration function.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    public async countIntegrationByMerchant(merchantUuid: string): Promise<number> {
        try {
            const merchantId = await this.getMerchantIdByUuid(merchantUuid);

            const getIntegrationCountQuery = `
            SELECT COUNT(*) AS integrationCount
            FROM integration
            LEFT JOIN integration_settings ON integration_settings.integration_id = integration.id
            WHERE integration.merchant_id = ?
              AND integration_settings.is_deleted = 0
        `;

            const rows = await this.mySqlDataSource.executeQuery<IntegrationCount[] | []>(getIntegrationCountQuery, [merchantId]);

            return rows.length > 0 ? rows[0].integrationCount : 0;

        } catch (err) {
            const error = new SqlException(
                'Failed while executing countIntegrationByMerchant function.',
                ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR,
                {cause: err}
            );
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

    private async getMerchantIdByUuid(merchantUuid: string): Promise<number> {
        try {
            const getMerchantIdQuery = `
        SELECT id
        FROM merchant
        WHERE uuid = ?
        LIMIT 1
    `;

            const merchantResult: GetMerchant[] | [] = await this.mySqlDataSource.executeQuery(getMerchantIdQuery, [merchantUuid]);

            if (merchantResult.length === 0) {
                const error = new SqlException('Failed while getting merchant.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }
            return merchantResult[0].id;
        }catch(err) {
            const error = new SqlException('Failed while executing getMerchantIdByUuid function.', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }

}
