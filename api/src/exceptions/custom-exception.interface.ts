import {ExceptionCodeEnum} from './exception-code.enum';

export interface CustomException {
	name: string;
	message: string;
	errorCode: ExceptionCodeEnum;
	cause: unknown;
	alreadyLogged: boolean;
}
