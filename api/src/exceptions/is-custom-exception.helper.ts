import {CustomException} from './custom-exception.interface';

export const isCustomException = (error: unknown): error is CustomException => {
	return (
		error !== null &&
		typeof error === 'object' &&
		'alreadyLogged' in error
	);
};
