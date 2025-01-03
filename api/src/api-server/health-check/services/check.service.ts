import {Status, Telemetry} from '../interfaces';
import {HealthCheckModel} from "../../../data-sources/sql/models/health-check.model";
// import {RabbitDataSource} from '../../../data-sources/rabbit/rabbit-data-source';
// import {SqlDataAccessFacade} from '../../../data-sources/sql/sql-data-access.facade';
// import {Connection} from 'amqplib';

export class CheckService {
	// private readonly rabbitDataSource: RabbitDataSource = RabbitDataSource.getInstance();
	// private readonly sqlDataAccessFacade: SqlDataAccessFacade = SqlDataAccessFacade.getInstance();

	public async getTelemetry(): Promise<Telemetry> {
		// eslint-disable-next-line init-declarations
		// let rabbit: Status;
		// eslint-disable-next-line init-declarations
		let mysql: Status;

		// try {
		// 	const connection: Connection | null = this.rabbitDataSource.getConnection();
		// 	rabbit = connection ? Status.OK : Status.ERROR;
		// } catch (err) {
		// 	rabbit = Status.ERROR;
		// }

		try {
			await HealthCheckModel.healthQueryQuery();
			mysql = Status.OK;
		} catch (err) {
			mysql = Status.ERROR;
		}

		return {
			// rabbit,
			mysql,
		};
	}
}
