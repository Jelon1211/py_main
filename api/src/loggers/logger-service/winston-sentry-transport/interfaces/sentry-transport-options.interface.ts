import TransportStream from 'winston-transport';
import {SeverityOptions} from './severity-options.interface';

export interface SentryTransportOptions
	extends TransportStream.TransportStreamOptions {
	levelsMap?: SeverityOptions;
}
