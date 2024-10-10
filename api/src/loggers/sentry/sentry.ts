import {Express, RequestHandler} from 'express';
import {TransactionEvent} from '@sentry/types/types/event';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import {Config} from '../../config-builder/config.interface';
import ConfigBuilder from '../../config-builder/config-builder';
import {ExceptionCodeEnum} from '../../exceptions/exception-code.enum';
import {ApplicationException} from '../../exceptions/application.exception';

export class AppSentry {
	private static instance: AppSentry | null = null;
	private readonly config: Config = ConfigBuilder.getConfig().config;
	private skipTransactionEventList: string[] = this.config.sentry.tracing.skipTransactionEventList;
	private stripedTransactionTagList: string[] = Array.from(new Set(this.config.sentry.tracing.stripedTransactionTagList)).sort((a, b) => b.length - a.length);
	private _isSentryInit: boolean = false;

	private constructor(private readonly app: Express) {
		if (!this.config.sentry.tracing.enabled) {
			return;
		}
		Sentry.init({...this.withDefaults(this.config.sentry), ...this.getAdditionalConfig()});
		this.app.use(Sentry.Handlers.tracingHandler() as RequestHandler);
		this._isSentryInit = true;
	}

	public get isSentryInit() {
		return this._isSentryInit;
	}

	public static getInstance(app?: Express): AppSentry {
		if (AppSentry.instance) {
			return AppSentry.instance;
		}
		if (!app) {
			throw new ApplicationException('Error on try to get Sentry instance due to not pass express app while creating a new Sentry instance', ExceptionCodeEnum.EXPRESS_APP__START_ERR);
		}
		return (AppSentry.instance = new AppSentry(app));
	}

	public startWithExistingTransaction(operationName: string, transactionName: string): Sentry.Transaction {
		const existingTransaction: Sentry.Transaction | undefined = Sentry.getCurrentHub().getScope().getTransaction();

		const transaction: Sentry.Transaction = existingTransaction || Sentry.startTransaction({
			op:   operationName,
			name: transactionName,
		});
		Sentry.getCurrentScope().setSpan(transaction);
		return transaction;
	}

	public startWithNewTransaction(operationName: string, transactionName: string): Sentry.Transaction {
		const transaction: Sentry.Transaction = Sentry.startTransaction({
			op:   operationName,
			name: transactionName,
		});
		Sentry.getCurrentScope().setSpan(transaction);
		return transaction;
	}

	public finishPassedTransaction(transaction: Sentry.Transaction) {
		transaction.finish();
	}

	public startAndGetNewSpanForTransaction(transaction: Sentry.Transaction, operation: string): Sentry.Span {
		const span: Sentry.Span | undefined = transaction?.startChild({
			op: operation,
		});
		if (span) {
			Sentry.getCurrentScope().setSpan(span);
		}
		return span;
	}

	public finishPassedSpan(span: Sentry.Span): void {
		span.finish();
	}

	private getAdditionalConfig() {
		return {
			integrations:          [
				new Sentry.Integrations.Http({tracing: true}),
				new Tracing.Integrations.Express({
					app: this.app,
				})
			],
			tracesSampleRate:      this.config.sentry.tracing.tracesSampleRate,
			beforeSendTransaction: (event: TransactionEvent): null | TransactionEvent => {
				if (event.sdkProcessingMetadata?.request?.route?.path === '*') {
					return null;
				}

				if (event.transaction && this.skipTransactionEventList.includes(event.transaction)) {
					// Don't send the event to Sentry when transaction is initialized by route from list
					return null;
				}

				event.spans = event.spans?.map((span) => {
					// For now, we're only stripping db tags
					if (span.op !== 'db') {
						return span;
					}
					if (span.description) {
						const isStrippedDescription = this.checkForbidden(span.description);
						if (isStrippedDescription.valid) {
							span.description = `*** STRIPPED by keyword: ${isStrippedDescription.str as string} ***`;
						}
					}
					return span;
				});

				return event;
			},
			beforeBreadcrumb:      (breadcrumb: Sentry.Breadcrumb) => {
				return breadcrumb.category === "console" ? null : breadcrumb;
			},
		};
	}

	private withDefaults(options: Sentry.NodeOptions) {
		return {
			...options,
			dsn:            (options && options.dsn) || process.env.SENTRY_DSN || "",
			environment:    (options && options.environment) || process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "production",
			debug:          (options && options.debug) || !!process.env.SENTRY_DEBUG || false,
			sampleRate:     (options && options.sampleRate) || 1.0,
			maxBreadcrumbs: (options && options.maxBreadcrumbs) || 100,
		};
	}

	private checkForbidden = (strToCheck: string): { valid: boolean, str: string | null } => {
		const [foundForbidden] = this.stripedTransactionTagList.map((el: string) => (strToCheck.includes(el) ? el : null)).filter(Boolean);

		return {
			valid: !!foundForbidden,
			str:   foundForbidden || null
		};
	};
}
