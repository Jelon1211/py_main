import debSql from 'debug';
import mysql, {MysqlError, Pool, PoolCluster, PoolConnection} from 'mysql';
import {Config, ConfiguredPool, ConnectionTypeId} from '../../config-builder/config.interface';
import ConfigBuilder from '../../config-builder/config-builder';
import {SqlException} from '../../exceptions/sql.exception';
import {ExceptionCodeEnum} from '../../exceptions/exception-code.enum';
import {AppLogger} from '../../loggers/logger-service/logger.service';
import {LoggerLevelEnum} from '../../loggers/log-level/logger-level.enum';
import {ErrorLog} from '../../loggers/error-log/error-log.instance';
import {InfoLog} from '../../loggers/info-log/info-log.instance';

export class MySqlDataSource {
	private static instance: MySqlDataSource | null = null;
	private readonly config: Config = ConfigBuilder.getConfig().config;
	private readonly logger: AppLogger = AppLogger.getInstance();
	private readonly debug = debSql('MySql');
	private mysqlPoolCluster: PoolCluster;
	private poolRecreateAttempt = {
		[ConnectionTypeId.READ]:  1,
		[ConnectionTypeId.WRITE]: 1,
	};
	private readonly configuredPools: ConfiguredPool[] = [
		{id: this.config.mysqlRead.id, connection: this.config.mysqlRead.connection},
		{id: this.config.mysqlWrite.id, connection: this.config.mysqlWrite.connection},
	];

	private constructor() {
		try {
			this.checkConfig();
			this.addPools();
			this.runDebuggers();
		} catch (err) {
			const error = new SqlException('Error while init MySqlDataSource', ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR, {cause: err});
			this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
			throw error;
		}
	}

	public static getInstance() {
		if (MySqlDataSource.instance) {
			return MySqlDataSource.instance;
		}
		return (MySqlDataSource.instance = new MySqlDataSource());
	}

	public async testConnections() {
		try {
			const testConnections = await Promise.all(this.configuredPools.map((configuredPool: ConfiguredPool) => this.getConnection(configuredPool.id)));
			testConnections.forEach((connection: PoolConnection) => connection.release());
			this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Test connections for configured pools acquired and released.'));
		} catch (err) {
			const error = new SqlException('Error while testing connection for each pool configured.', ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR, {cause: err});
			this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
			throw error;
		}
	}

	public async executeQuery<T>(query: string, params: Array<unknown> = [], isWrite: boolean = false): Promise<T> {
		const connectionTypeId: ConnectionTypeId = isWrite ? ConnectionTypeId.WRITE : ConnectionTypeId.READ;
		const connection: PoolConnection = await this.getConnection(connectionTypeId);

		return new Promise((resolve, reject) => {
			query = mysql.format(query, params);

			connection.query(query, (queryError, rows: T) => {
				this.logger.log(LoggerLevelEnum.DEBUG, new InfoLog('Sql procedure called,', {query}));
				this.debug(query);
				connection.release();
				if (queryError) {
					return reject(queryError);
				}
				return resolve(rows);
			});
		});
	}

	private getConnection(connectionType: ConnectionTypeId): Promise<PoolConnection> {
		return new Promise((resolve) => {
			this.mysqlPoolCluster.getConnection(connectionType, (err: MysqlError, connection: PoolConnection) => {
				if (err) {
					if (connection) {
						connection.release();
					}
					this.poolRecreateAttempt[connectionType]++;
					const error = new SqlException(`Cannot get connection to MySql for connection" ${connectionType}, attempts: ${this.poolRecreateAttempt[connectionType]}. Retry again ...`, ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR, {cause: err});
					this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));

					this.addPools();
					this.runDebuggers();

					return resolve(this.getConnection(connectionType));
				}
				this.poolRecreateAttempt[connectionType] = 1;
				return resolve(connection);
			});
		});
	}

	private addPools(): void {
		try {
			this.mysqlPoolCluster = mysql.createPoolCluster();
			this.configuredPools.forEach((configurePool: ConfiguredPool) => {
				this.mysqlPoolCluster.add(configurePool.id, configurePool.connection);
			});
		} catch (err) {
			throw new SqlException('Error while adding pools to cluster for all configured pools.', ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR, {cause: err});
		}
	}

	private checkConfig(): void {
		if (!(this.config.mysqlRead.connection && this.config.mysqlWrite.connection)) {
			throw new SqlException('Config has no mysql property defined. Check configuration file.', ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR);
		}
	}

	private runDebuggers(): void {
		try {
			const pools: Pool[] = this.configuredPools.map((configuredPool: ConfiguredPool) => (
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				this.mysqlPoolCluster._nodes[configuredPool.id].pool as Pool
			));

			for (const pool of pools) {
				pool.on('enqueue', () => {
					this.debug('Waiting for available connection slot.');
				});
				pool.on('acquire', (connection: { threadId: number; }) => {
					this.debug(`Connection acquired. Thread Id: ${connection.threadId}`);
				});
				pool.on('connection', () => {
					this.debug('A new connection has been made with pool.');
				});
				pool.on('release', (connection: { threadId: number; }) => {
					this.debug(`Connection released. Thread Id: ${connection.threadId}`);
				});
			}
		} catch (err) {
			throw new SqlException('Error while adding debuggers for each pool configured.', ExceptionCodeEnum.MYSQL_SERVICE__CONN_ERR, {cause: err});
		}
	}
}


