import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {ExceptionCodeEnum} from "../../../exceptions/exception-code.enum";
import {LoggerLevelEnum} from "../../../loggers/log-level/logger-level.enum";
import {ErrorLog} from "../../../loggers/error-log/error-log.instance";
import {AppLogger} from "../../../loggers/logger-service/logger.service";
import {HttpMethod} from "../../base/http-method.enum";
import {ApiloException} from "../../../exceptions/apilo.exception";
export class ApiloApiClientService {
    private readonly logger: AppLogger = AppLogger.getInstance();



    constructor() {
    }


    public async sendApiloRequest<T>(endpoint: string, parameters: Record<string, unknown> = {}, auth: string, method: HttpMethod = HttpMethod.POST): Promise<T> {
        try {
            const axiosConfig: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': auth,
                },
                params: method === HttpMethod.GET ? parameters : {},
            };

            // eslint-disable-next-line @typescript-eslint/ban-types
            const axiosMethods: Record<HttpMethod, Function> = {
                [HttpMethod.GET]: () => axios.get(endpoint, axiosConfig),
                [HttpMethod.POST]: () => axios.post(endpoint, parameters, axiosConfig),
                [HttpMethod.PUT]: () => axios.put(endpoint, parameters, axiosConfig),
                [HttpMethod.DELETE]: () => axios.delete(endpoint, axiosConfig),
            };

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,security/detect-object-injection
            const response: AxiosResponse<T> = await axiosMethods[method]();

            return response.data;
        } catch (err) {
            const error = new ApiloException('Error during Apilo request', ExceptionCodeEnum.APILO_SERVICE__GENERAL_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error
        }
    }

}
