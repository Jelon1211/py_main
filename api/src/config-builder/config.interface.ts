interface ExpressApi {
  bind: string;
  port: number;
  authorizationToken: string;
}

interface Proxy {
  protocol: string | null;
  host: string | null;
  port: number;
  user: string | null;
  password: string | null;
}

interface Luxon {
  timezone: string;
}

interface CheckAvailabilityOptions {
  responseTimeout: number;
}

interface Winston {
  console: WinstonConsole;
  sentry: WinstonSentry;
  transports: WinstonTransports;
  exitOnError: boolean;
}

export interface ConfigSentry {
  tracing: {
    enabled: boolean;
    tracesSampleRate: number;
    stripedTransactionTagList: string[];
    skipTransactionEventList: string[];
  };
  dsn: string;
  environment: string;
  release: string;
}

export interface ConfiguredPool {
  id: ConnectionTypeId;
  connection: MySqlConnection;
}

interface CommunicatorsData {
  url: string;
  token: string;
}

interface WinstonConsole {
  level: string;
  handleExceptions: boolean;
  json: boolean;
  colorize: boolean;
}

interface WinstonSentry {
  level: string;
}

interface WinstonTransports {
  console: {
    enabled: boolean;
  };
  sentry: {
    enabled: boolean;
  };
}

export enum ConnectionTypeId {
  READ = 'READ',
  WRITE = 'WRITE',
}

export interface MySqlConnection {
  connectionLimit: number;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  charset: string;
  timezone?: string;
}

interface Communicators {
  rocket: CommunicatorsData;
  telegram: TelegramCommunicatorsData;
}

interface DeadLetterQueue {
  key: string;
  ttl: number;
}

interface Finish {
  attempts: number;
}

interface DeadLetterExchange {
  exchange: string;
}

interface TelegramCommunicatorsData extends CommunicatorsData {
  chatId: string;
}

export interface Config {
  application: string;
  applicationKey: string;
  nonBlockingModeNetworkAvailability: boolean;
  nonBlockingModeConversionAvailability: boolean;
  conversionAvailabilityTime: number;
  expressApi: ExpressApi;
  proxy: Proxy;
  luxon: Luxon;
  checkAvailabilityOptions: CheckAvailabilityOptions;
  winston: Winston;
  sentry: ConfigSentry;
  mysqlRead: ConfiguredPool;
  mysqlWrite: ConfiguredPool;
  communicators: Communicators;
}
