import {MySqlDataSource} from "../sql-data-source";

export class HealthCheckModel {
    static async healthQueryQuery() {
        const dataSource = MySqlDataSource.getInstance();

        const results: [][] = await dataSource.executeQuery<[][]>('SELECT 1', []);
        return results[0];

    }
}


