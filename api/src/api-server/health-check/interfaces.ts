export enum Status {
	OK = 'OK',
	ERROR = 'ERROR'
}

export interface Telemetry {
	// rabbit: Status,
	mysql: Status,
}
