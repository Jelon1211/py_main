import * as Sentry from '@sentry/node';

export interface SeverityOptions {
	[key: string]: Sentry.SeverityLevel;
}
