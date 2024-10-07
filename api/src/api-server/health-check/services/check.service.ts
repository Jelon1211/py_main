import { Status, Telemetry } from '../interfaces';
import { SqlDataAccessFacade } from '../../../data-sources/sql/sql-data-access.facade';

export class CheckService {
  private readonly sqlDataAccessFacade: SqlDataAccessFacade =
    SqlDataAccessFacade.getInstance();

  public async getTelemetry(): Promise<Telemetry> {
    // eslint-disable-next-line init-declarations
    let mysql: Status;

    try {
      await this.sqlDataAccessFacade.healthQueryQuery();
      mysql = Status.OK;
    } catch (err) {
      mysql = Status.ERROR;
    }

    return {
      mysql,
    };
  }
}
