export enum Status {
  OK = 'OK',
  ERROR = 'ERROR',
}

export interface Telemetry {
  mysql: Status;
}
