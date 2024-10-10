import {IInfoLog} from './info-log.interface';

export class InfoLog implements IInfoLog {

	constructor(readonly message: string, readonly additionalData?: unknown, readonly taskId?: string) {
	}
}
