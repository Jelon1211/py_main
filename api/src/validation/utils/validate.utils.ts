import jsonschema, {ValidationError, Validator} from 'jsonschema';

export class ValidateUtils {
	public static validate(data: unknown, schema: object): true {
		const validatorExt: Validator = new jsonschema.Validator();
		const validationResult: ValidationError[] = validatorExt.validate(data, schema).errors;
		if (!validationResult.length) {
			return true;
		}
		throw validationResult;
	}
}
