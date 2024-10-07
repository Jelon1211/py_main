import {SeverityOptions} from './interfaces/severity-options.interface';

export enum SentrySeverity {
	Debug = "debug",
	Log = "log",
	Info = "info",
	Warning = "warning",
	Error = "error",
	Fatal = "fatal",
}

export const DEFAULT_LEVELS_MAP: SeverityOptions = {
	silly:   SentrySeverity.Debug,
	verbose: SentrySeverity.Debug,
	info:    SentrySeverity.Info,
	debug:   SentrySeverity.Debug,
	warn:    SentrySeverity.Warning,
	error:   SentrySeverity.Error,
};
