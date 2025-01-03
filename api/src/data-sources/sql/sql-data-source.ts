import debSql from 'debug';
import mysql from 'mysql2';
import {Config} from '../../config-builder/config.interface';
import ConfigBuilder from '../../config-builder/config-builder';
import {AppLogger} from '../../loggers/logger-service/logger.service';
import {LoggerLevelEnum} from '../../loggers/log-level/logger-level.enum';
import {SqlException} from '../../exceptions/sql.exception';
import {ExceptionCodeEnum} from '../../exceptions/exception-code.enum';
import {InfoLog} from "../../loggers/info-log/info-log.instance";
import {ErrorLog} from "../../loggers/error-log/error-log.instance";

export class MySqlDataSource {
    private static instance: MySqlDataSource | null = null;
    private readonly config: Config = ConfigBuilder.getConfig().config;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private mysqlPool: mysql.PoolCluster | null = null;
    private readonly debug = debSql('MySql');

    private constructor() {
        this.initialize();
    }

    public static getInstance(): MySqlDataSource {
        if (!MySqlDataSource.instance) {
            MySqlDataSource.instance = new MySqlDataSource();
        }
        return MySqlDataSource.instance;
    }

    private initialize(): void {
        if (!this.config.mysqlRead || !this.config.mysqlWrite) {
            const error = new SqlException(
                'Missing MySQL configuration in the config file.',
                ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR
            );
            this.logger.log(LoggerLevelEnum.ERROR, error);
            throw error;
        }

        this.mysqlPool = mysql.createPoolCluster();
        this.mysqlPool.add(this.config.mysqlRead.id, this.config.mysqlRead.connection);
        this.mysqlPool.add(this.config.mysqlWrite.id, this.config.mysqlWrite.connection);

        this.addPoolListeners();
    }

    private addPoolListeners(): void {
        if (!this.mysqlPool) {
            return;
        }

        this.mysqlPool.on('enqueue', () => {
            this.debug('Waiting for available connection slot.');
        });

        this.mysqlPool.on('acquire', (connection: any) => {
            this.debug(`Connection acquired. Thread Id: ${connection.threadId}`);
        });

        this.mysqlPool.on('release', (connection: any) => {
            this.debug(`Connection released. Thread Id: ${connection.threadId}`);
        });
    }

    public executeQuery<T>(query: string, params: any[] = [], isWrite: boolean = false): Promise<T> {
        if (!this.mysqlPool) {
            throw new SqlException('MySQL pool has not been initialized.', ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR);
        }

        const poolType = isWrite ? this.config.mysqlWrite.id : this.config.mysqlRead.id;

        return new Promise<T>((resolve, reject) => {
            this.mysqlPool!.getConnection(poolType, (error, connection) => {
                if (error) {
                    this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
                    connection?.release();
                    return reject(error);
                }

                const formattedQuery = mysql.format(query, params);
                this.debug(`Executing query: ${formattedQuery}`);

                connection.query(formattedQuery, (queryError, results: any) => {
                    this.logger.log(LoggerLevelEnum.DEBUG, new InfoLog('Sql procedure called,', {query}));
                    this.debug(query);
                    connection.release();

                    if (queryError) {
                        return reject(queryError);
                    }

                    resolve(results as T);
                });
            });
        });
    }

    public async testConnections(): Promise<void> {
        if (!this.mysqlPool) {
            throw new SqlException('MySQL pool has not been initialized.', ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR);
        }

        try {
            const testReadConnection = new Promise((resolve, reject) => {
                this.mysqlPool!.getConnection(this.config.mysqlRead.id, (error, connection) => {
                    if (error) {
                        connection?.release();
                        return reject(error);
                    }
                    connection?.release();
                    resolve(true);
                });
            });

            const testWriteConnection = new Promise((resolve, reject) => {
                this.mysqlPool!.getConnection(this.config.mysqlWrite.id, (error, connection) => {
                    if (error) {
                        connection?.release();
                        return reject(error);
                    }
                    connection?.release();
                    resolve(true);
                });
            });

            await Promise.all([testReadConnection, testWriteConnection]);
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('All MySQL pools tested successfully.'));
        } catch (err) {
            const error = new SqlException('Error while testing connection for each pool configured.', ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }
}
