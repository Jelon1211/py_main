import * as Sentry from "@sentry/node";
import TransportStream from 'winston-transport';
import {SeverityOptions} from './interfaces/severity-options.interface';
import {DEFAULT_LEVELS_MAP, SentrySeverity} from './winston-sentry-level.map';
import {WinstonInfo} from './interfaces/winston-info.interface';
import {SentryTransportOptions} from './interfaces/sentry-transport-options.interface';
import {DefaultError} from './default-error';
import {AppSentry} from '../../sentry/sentry';
import {ApplicationException} from '../../../exceptions/application.exception';
import {ExceptionCodeEnum} from '../../../exceptions/exception-code.enum';

class WinstonSentryTransport extends TransportStream {
	public silent: boolean = false;
	private readonly levelsMap: SeverityOptions = {};

	constructor(appSentry: AppSentry, opts?: SentryTransportOptions) {
		if (!appSentry.isSentryInit) {
			throw new ApplicationException('Error on try to init winston-sentry transport due to not Sentry initialized earlier', ExceptionCodeEnum.EXPRESS_APP__START_ERR);
		}
		super(opts);

		this.silent = (opts && opts.silent) || false;
		this.levelsMap = this.setLevelsMap(opts && opts.levelsMap);
	}

	public log(info: WinstonInfo, callback: () => void): void {
		setImmediate(() => {
			this.emit("logged", info);
		});
		if (this.silent) {
			return callback();
		}

		const {message, tags, user, ...meta}: WinstonInfo = info;

		const winstonLevel: string = info.level;
		const sentryLevel: Sentry.SeverityLevel | undefined = Object.entries(this.levelsMap).find(([key]) => winstonLevel?.includes(key))?.[1];

		Sentry.configureScope((scope: Sentry.Scope) => {
			const sentryTransaction: Sentry.Transaction | undefined = scope.getTransaction();
			const sentrySpan: Sentry.Span | undefined = scope.getSpan();

			delete meta?.errorReplacer;
			meta.level = sentryLevel || meta.level;
			scope.setExtras(meta);
			if (tags !== undefined && WinstonSentryTransport.isObject(tags)) {
				scope.setTags(tags);
			}
			if (user !== undefined && WinstonSentryTransport.isObject(user)) {
				scope.setUser(user);
			}
			if (sentrySpan) {
				scope.setSpan(sentrySpan);
			} else if (sentryTransaction) {
				scope.setSpan(sentryTransaction);
			}
		});

		if (sentryLevel && WinstonSentryTransport.shouldLogException(sentryLevel)) {
			const sentryError = this.getErrorInstance(info);

			Sentry.captureException(sentryError, {tags});
			return callback();
		}

		Sentry.captureMessage(message, sentryLevel);
		return callback();
	}

	private static isObject(obj: unknown) {
		const type = typeof obj;
		return type === "function" || (type === "object" && !!obj);
	}

	private static shouldLogException(level: Sentry.SeverityLevel) {
		return level === SentrySeverity.Fatal || level === SentrySeverity.Error;
	}

	private setLevelsMap = (options?: SeverityOptions): SeverityOptions => {
		if (!options) {
			return DEFAULT_LEVELS_MAP;
		}

		const customLevelsMap = Object.keys(options).reduce<SeverityOptions>(
			(acc: { [key: string]: Sentry.SeverityLevel }, winstonSeverity: string) => {
				acc[winstonSeverity] = options[winstonSeverity];
				return acc;
			},
			{}
		);

		return {
			...DEFAULT_LEVELS_MAP,
			...customLevelsMap,
		};
	};

	private getErrorInstance(info: WinstonInfo): Error {
		if (info.error instanceof Error) {
			return info.error;
		}
		return new DefaultError(info);
	}

}

export default WinstonSentryTransport;
