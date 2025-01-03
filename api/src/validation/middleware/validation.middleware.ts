import {Request, Response, NextFunction} from 'express';
import {ValidateUtils} from "../utils/validate.utils";
import {HttpException} from "../../exceptions/http.exception";
import {AppLogger} from "../../loggers/logger-service/logger.service";
import {LoggerLevelEnum} from "../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../loggers/error-log/error-log.instance";

export class ValidationMiddleware {

    public static validate(schema: object) {
        return (req: Request, res: Response, next: NextFunction) => {
        const logger: AppLogger = AppLogger.getInstance();

            try {
                ValidateUtils.validate(req.body, schema);
                next();
            } catch (err) {
                const validationError = new HttpException('Validation error', 400, {cause: err});
                logger.log(LoggerLevelEnum.ERROR, new ErrorLog(err));
                next(validationError);
            }
        };
    }
}
