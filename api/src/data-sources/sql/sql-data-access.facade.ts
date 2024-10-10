import { MySqlDataSource } from './sql-data-source';
import { AppLogger } from '../../loggers/logger-service/logger.service';
import { SqlException } from '../../exceptions/sql.exception';
import { ExceptionCodeEnum } from '../../exceptions/exception-code.enum';
import { LoggerLevelEnum } from '../../loggers/log-level/logger-level.enum';
import { ErrorLog } from '../../loggers/error-log/error-log.instance';
import { TestQuery } from './sql-interfaces/sql.interfaces';

export class SqlDataAccessFacade {
  private static instance: SqlDataAccessFacade | null = null;
  private readonly logger: AppLogger = AppLogger.getInstance();
  private readonly mySqlDataSource: MySqlDataSource =
    MySqlDataSource.getInstance();

  private constructor() {}

  public static getInstance() {
    if (SqlDataAccessFacade.instance) {
      return SqlDataAccessFacade.instance;
    }
    return (SqlDataAccessFacade.instance = new SqlDataAccessFacade());
  }

  public async updateXXX(
    xxxCode: string | null,
    zzzzz: string | null,
    error: number,
  ) {
    try {
      const results: [][] = await this.mySqlDataSource.executeQuery<[][]>(
        'CALL xxx(?,?,?)',
        [xxxCode, zzzzz, error],
        true,
      );
      return results[0];
    } catch (err) {
      const error = new SqlException(
        'Failed while executing updateXxx function.',
        ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR,
        { cause: err },
      );
      this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
      throw error;
    }
  }

  public async healthQueryQuery() {
    try {
      const results: TestQuery[] = await this.mySqlDataSource.executeQuery<
        TestQuery[]
      >('SELECT 1', []);
      return results[0];
    } catch (err) {
      const error = new SqlException(
        'Failed while executing healthQueryQuery function.',
        ExceptionCodeEnum.MYSQL_SERVICE__QUERY_ERR,
        { cause: err },
      );
      this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
      throw error;
    }
  }
}
