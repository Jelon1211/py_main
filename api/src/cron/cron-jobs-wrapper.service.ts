import {CronJob} from 'cron';

export class CronJobsWrapperService {
	constructor(private readonly cronJobs: CronJob[]) {
	}

	public startAll(): void {
		for (const job of this.cronJobs) {
			job.start();
		}
	}
}
