import {URLSearchParams} from "url";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {BaselinkerException} from "../../../exceptions/baselinker.exception";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {BaselinkerMethods} from "../enums";
import {Config} from "../../../config-builder/config.interface";
import ConfigBuilder from "../../../config-builder/config-builder";

type TokenQueue = {
    count: number;
    resetTime: number;
    queue: Array<() => void>;
};

export class BaselinkerApiClientService {
    private readonly config: Config = ConfigBuilder.getConfig().config;
    private readonly logger: AppLogger = AppLogger.getInstance();
    private tokenLimits: Record<string, TokenQueue> = {};


    constructor() {
    }


    private handleRateLimit(token: string): Promise<void> {
        const currentTime = Date.now();

        if (!this.tokenLimits[token]) {
            this.tokenLimits[token] = {
                count: 0,
                resetTime: currentTime + 60 * 1000,
                queue: [],
            };
        }

        // eslint-disable-next-line security/detect-object-injection
        const tokenData = this.tokenLimits[token];

        if (tokenData.count >= 100) {
            return new Promise<void>((resolve) => {
                const wrapResolve = () => resolve();
                tokenData.queue.push(wrapResolve);
            });
        }
        tokenData.count++;

        setTimeout(() => {
            tokenData.count--;

            if (tokenData.queue.length > 0) {
                const next = tokenData.queue.shift();
                if (next) {
                    next();
                }
            }
        }, tokenData.resetTime - currentTime);
    }

    public async sendBaselinkerRequest<T>(method: BaselinkerMethods, parameters: Record<string, unknown> = {}, token: string): Promise<T> {
        await this.handleRateLimit(token);
        try {
            const data = new URLSearchParams();
            data.append('method', method);

            const parametersJSON = JSON.stringify(parameters);
            data.append('parameters', parametersJSON);

            const axiosConfig: AxiosRequestConfig = {
                headers: {
                    'X-BLToken': token,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            };

            const response: AxiosResponse<T> = await axios.post(this.config.baselinker.apiUrl, data.toString(), axiosConfig);
            return response.data;
        } catch (err) {
            const error = new BaselinkerException('Error during baselinker request', ExceptionCodeEnum.BASELINKER_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }
}
