import {createLogger, transports, format as winstonFormat, Logger as LoggerWinston} from 'winston';
import {ConsoleTransportInstance} from 'winston/lib/winston/transports';
import WinstonSentryTransport from './winston-sentry-transport/winston-sentry-transport';
import {TransformableInfo} from 'logform';
import {ExpressStream} from './express-stream.interface';
import ConfigBuilder from '../../config-builder/config-builder';
import {Config} from '../../config-builder/config.interface';
import {LoggerLevelEnum} from '../log-level/logger-level.enum';
import {ErrorLog} from '../error-log/error-log.instance';
import {InfoLog} from '../info-log/info-log.instance';
import {isCustomException} from '../../exceptions/is-custom-exception.helper';
import {AppSentry} from '../sentry/sentry';
import {ApplicationException} from '../../exceptions/application.exception';
import {ExceptionCodeEnum} from '../../exceptions/exception-code.enum';

export class AppLogger {
	public expressStream: ExpressStream;
	private winstonLogger: LoggerWinston;
	private readonly config: Config = ConfigBuilder.getConfig().config;
	private static instance: AppLogger | null = null;
	private readonly winstonFormat = winstonFormat;
	private readonly enabledTransports: Array<ConsoleTransportInstance | WinstonSentryTransport> = [];

	private constructor(appSentry: AppSentry) {
		if (this.config.winston.transports.console.enabled) {
			this.enabledTransports.push(new transports.Console(this.config.winston.console));
		}

		if (this.config.winston.transports.sentry.enabled) {
			this.enabledTransports.push(new WinstonSentryTransport(appSentry, {
				level: this.config.winston.sentry.level,
			}));
		}

		this.winstonLogger = this.getLogger();
		this.expressStream = this.getExpressStream();
	}

	public log(level: LoggerLevelEnum, logPayload: ErrorLog | InfoLog) {
		if (logPayload instanceof ErrorLog) {
			logPayload.error.alreadyLogged = true;
		}
		if (logPayload instanceof ErrorLog && isCustomException(logPayload.cause)) {
			if (logPayload.cause.alreadyLogged) {
				return;
			}
		}
		this.winstonLogger.log(level, logPayload);
	}

	public static getInstance(appSentry?: AppSentry): AppLogger {
		if (AppLogger.instance) {
			return AppLogger.instance;
		}
		if (!appSentry) {
			throw new ApplicationException('Error on try to get logger instance due to not pass sentry instance while creating a new logger instance', ExceptionCodeEnum.EXPRESS_APP__START_ERR);
		}
		return (AppLogger.instance = new AppLogger(appSentry));
	}

	private getLogger() {
		const {combine, label, timestamp, splat, colorize, simple, json} = this.winstonFormat;

		const formats = [
			label({label: this.config.application}),
			timestamp(),
			splat(),
			this.ignorePrivate(),
			this.generateCustomFormat(),

		];

		if (this.config.winston.console.json) {
			formats.push(json());
		}
		if (this.config.winston.console.colorize) {
			formats.push(colorize(), simple());
		}

		return createLogger({
			format:      combine(...formats),
			transports:  this.enabledTransports,
			exitOnError: this.config.winston.exitOnError
		});
	}

	private getExpressStream(): ExpressStream {
		return {
			write: (message: string) => {
				this.winstonLogger.log({
					level:   LoggerLevelEnum.INFO,
					source:  'express',
					message: message.substring(0, message.lastIndexOf('\n'))
				});
			}
		};
	}

	private generateCustomFormat() {
		return this.winstonFormat.printf((data: TransformableInfo): string => {
			if (data.source === 'express') { // That's express log format
				return `[${data.timestamp}] [${data.label}] [exp] [${data.level}] ${data.message}`;
			} else {
				if (data.error instanceof Error) {
					data.error = {
						name:    data.error.name,
						message: data.error.message,
						stack:   data.error.stack,
					};
				}
				return `[${data.timestamp}] [${data.label}] [app] [${data.level}] [${data.requestId || ''}] [${JSON.stringify(data)}]`;
			}
		});
	}

	private ignorePrivate() {
		return winstonFormat((data) => {
			if (data.private) {
				return false;
			}
			return data;
		})();
	}
}
