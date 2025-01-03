import express, {Express} from 'express';
import {getAppDetails} from './api-server/app-details/get-app-details';
import {assignProcessEnvs} from './api-server/app-details/assign-process-envs';
import {Morgan} from './loggers/morgan/morgan';
import ConfigBuilder from './config-builder/config-builder';
import {Config} from './config-builder/config.interface';
import {AppLogger} from './loggers/logger-service/logger.service';
import {ErrorLog} from './loggers/error-log/error-log.instance';
import {InfoLog} from './loggers/info-log/info-log.instance';
import {LoggerLevelEnum} from './loggers/log-level/logger-level.enum';
import {ApplicationException} from './exceptions/application.exception';
import {ExceptionCodeEnum} from './exceptions/exception-code.enum';
import {SecurityHelpers} from './api-server/security-helpers/security.helpers';
import {ApiloRoutes, BaseLinkerRoutes, OpenRoutes, PrestaRoutes, Routes, WoocommerceRoutes} from './api-server/main-router/routes.enum';
import {CheckRouter} from './api-server/health-check/router/check.router';
import {MainRouter} from './api-server/main-router/main.router';
import {NotFoundRouter} from './api-server/exception-handling/not-found/not-found.router';
import {AuthMiddleware} from './api-server/auth/auth.middleware';
import {JwtMiddleware} from "./api-server/auth/jwt.middleware";
import {HttpExceptionHandlerService} from './api-server/exception-handling/http-exception-handler/http.exception-handler.service';
import {CronJobsWrapperService} from './cron/cron-jobs-wrapper.service';
import {AppSentry} from './loggers/sentry/sentry';
import {MySqlDataSource} from "./data-sources/sql/sql-data-source";
import {IntegrationRouter} from "./api-server/integration/router/integration.router";
import {BaselinkerRouter} from "./api-server/baselinker/router/baselinker.router";
import {ApiloRouter} from "./api-server/apilo/router/apilo.router";
import {IntegrationEcommerceMiddleware} from "./api-server/auth/integration-ecommerce-middleware";
import {WoocommerceRouter} from "./api-server/woocommerce/router/woocommerce.router";
import {PrestaRouter} from "./api-server/prestashop/router/presta.router";
import {IntegrationSaasMiddleware} from "./api-server/auth/integration-saas.middleware";
import {SyncApiloProductsJob} from "./cron/crone-jobs/sync-apilo-products.job";
import {EbiuroProxyRouter} from "./api-server/ebiuro-proxy/router/ebiuro-proxy.router";

assignProcessEnvs(__dirname);

class Server {
    private readonly config: Config = ConfigBuilder.getConfig().config;
    private readonly app: Express = express();
    private readonly appSentry: AppSentry = AppSentry.getInstance(this.app);
    private readonly logger: AppLogger = AppLogger.getInstance(this.appSentry);
    private readonly morgan: Morgan = new Morgan(this.app, this.logger.expressStream);
    private readonly securityHelpers: SecurityHelpers = new SecurityHelpers(this.app);
    private authMiddleware: AuthMiddleware = new AuthMiddleware(this.app);
    private integrationEcommerceMiddleware: IntegrationEcommerceMiddleware = new IntegrationEcommerceMiddleware(this.app);
    private integrationSaasMiddleware: IntegrationSaasMiddleware = new IntegrationSaasMiddleware(this.app);
    private jwtMiddleware: JwtMiddleware = new JwtMiddleware(this.app);
    private mainRouter: MainRouter = new MainRouter(this.app);
    private httpExceptionHandler: HttpExceptionHandlerService = new HttpExceptionHandlerService(this.app);
    private readonly mySqlDataSource: MySqlDataSource = MySqlDataSource.getInstance();
    private readonly croneJobsWrapper: CronJobsWrapperService = new CronJobsWrapperService([new SyncApiloProductsJob().getCroneJob()]);

    public async start(): Promise<void> {
        try {
            this.logger.log(LoggerLevelEnum.INFO, new InfoLog('Application run details.', getAppDetails(__filename)));
            this.morgan.init([Routes.V1 + Routes.CHECK + Routes.PING]);

            this.app.use(express.json());

            this.app.use(express.urlencoded({extended: true}));

            this.securityHelpers.setSecureHeaders();
            this.securityHelpers.initSecureHeadersMiddleware();

            this.authMiddleware.init({
                excludedRoutes: [
                    Routes.V1 + Routes.CHECK + Routes.PING,
                    Routes.V1 + OpenRoutes.PRODUCT + OpenRoutes.SYNC + BaseLinkerRoutes.BASELINKER + OpenRoutes.INTEGRATIONKEY,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + BaseLinkerRoutes.BASELINKER + OpenRoutes.INTEGRATIONKEY,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + ApiloRoutes.APILO + OpenRoutes.INTEGRATIONKEY
                ]
            });

            this.jwtMiddleware.init({
                excludedRoutes: [
                    Routes.V1 + Routes.CHECK + Routes.PING,
                    Routes.V1 + Routes.CHECK + Routes.TELEMETRY,
                    Routes.V1 + OpenRoutes.PRODUCT + OpenRoutes.SYNC + WoocommerceRoutes.WOOCOMMERCE,
                    Routes.V1 + OpenRoutes.PRODUCT + OpenRoutes.SYNC + PrestaRoutes.PRESTA,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + WoocommerceRoutes.WOOCOMMERCE,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + PrestaRoutes.PRESTA,
                    Routes.V1 + OpenRoutes.PRODUCT + OpenRoutes.SYNC + BaseLinkerRoutes.BASELINKER + OpenRoutes.INTEGRATIONKEY,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + BaseLinkerRoutes.BASELINKER + OpenRoutes.INTEGRATIONKEY,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + ApiloRoutes.APILO + OpenRoutes.INTEGRATIONKEY
                ]
            });

            this.integrationEcommerceMiddleware.init({
                includedRoutes: [
                    Routes.V1 + OpenRoutes.PRODUCT + OpenRoutes.SYNC + WoocommerceRoutes.WOOCOMMERCE,
                    Routes.V1 + OpenRoutes.PRODUCT + OpenRoutes.SYNC + PrestaRoutes.PRESTA,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + WoocommerceRoutes.WOOCOMMERCE,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + PrestaRoutes.PRESTA
                ]
            })

            this.integrationSaasMiddleware.init({
                includedRoutes: [
                    Routes.V1 + OpenRoutes.PRODUCT + OpenRoutes.SYNC + BaseLinkerRoutes.BASELINKER + OpenRoutes.INTEGRATIONKEY,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + BaseLinkerRoutes.BASELINKER + OpenRoutes.INTEGRATIONKEY,
                    Routes.V1 + OpenRoutes.ORDER + OpenRoutes.SYNC + ApiloRoutes.APILO + OpenRoutes.INTEGRATIONKEY,
                ]
            })

            this.mainRouter.init([
                new CheckRouter().router,
                new IntegrationRouter().router,
                new EbiuroProxyRouter().router,
                new BaselinkerRouter().router,
                new ApiloRouter().router,
                new WoocommerceRouter().router,
                new PrestaRouter().router,
                new NotFoundRouter().router,
            ]);

            this.httpExceptionHandler.init();

            await this.mySqlDataSource.testConnections();

            this.croneJobsWrapper.startAll();

            this.app.listen(this.config.expressApi.port, () => {
                this.logger.log(LoggerLevelEnum.INFO, new InfoLog(`API endpoint started at ${this.config.expressApi.bind}:${this.config.expressApi.port}`));

            });
        } catch (err) {
            const error = new ApplicationException('Error starting API', ExceptionCodeEnum.EXPRESS_APP__START_ERR, {cause: err});
            this.logger.log(LoggerLevelEnum.ERROR, new ErrorLog(error));
            throw error;
        }
    }
}

const server = new Server();
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(() => server.start())();






