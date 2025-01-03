import {v4 as uuidv4} from "uuid";
import {MySqlDataSource} from "../sql-data-source";
import {MerchantRecord} from "../db-interfaces/merchant.interface"
import {SqlException} from "../../../exceptions/sql.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {AppLogger} from "../../../loggers/logger-service/logger.service";

export class WoocommerceModel {
    private static instance: WoocommerceModel | null = null;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private readonly mySqlDataSource: MySqlDataSource = MySqlDataSource.getInstance();

    private constructor() {
    }

    public static getInstance() {
        if (WoocommerceModel.instance) {
            return WoocommerceModel.instance;
        }
        return (WoocommerceModel.instance = new WoocommerceModel());
    }

    public async insertOrder(integrationUuid: string, wooOrder: string, orderId: number): Promise<{orderUuid: string}> {
        try {
            const integrationQuery = `
            SELECT id
            FROM integration
                WHERE integration . uuid = ?
            `

            const integrationId = await this.mySqlDataSource.executeQuery<{id: number}[]>(integrationQuery, [integrationUuid], true);

            if(integrationId.length === 0) {
                const error = new SqlException('Failed to retrieve integration', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            const insertQuery =
                "INSERT INTO `order` (`integration_id`,`uuid`, `external_id`, `data`, `created`, `modified`) VALUES (?, ?, ?, ?, ?, ?)";
            const selectQuery = "SELECT `uuid` FROM `order` WHERE `uuid` = ?";

            const uuid = uuidv4();
            const timestamp = Math.floor(Date.now() / 1000);

            await this.mySqlDataSource.executeQuery(insertQuery, [integrationId[0].id, uuid, orderId, wooOrder, timestamp, timestamp], true);

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

    public async checkOrderExists(integrationUuid: string, orderId: number): Promise<boolean> {
        try {
            const integrationQuery = `
            SELECT id
            FROM integration
                WHERE integration . uuid = ?
            `

            const integrationId = await this.mySqlDataSource.executeQuery<{id: number}[]>(integrationQuery, [integrationUuid], true);

            if(integrationId.length === 0) {
                const error = new SqlException('Failed to retrieve integration', ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR);
                this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                throw error;
            }

            const orderQuery = `
		        SELECT external_id
		        FROM \`order\`
		        WHERE integration_id = ?
			      AND external_id = ?
            `;


           const rows = await this.mySqlDataSource.executeQuery<{external_id: number}[]>(orderQuery, [integrationId[0].id, orderId], true);

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
}
