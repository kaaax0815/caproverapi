import { IAxiodResponse } from 'https://deno.land/x/axiod@0.22/interfaces.ts';
import { APIError } from './error.ts';
import debug from 'https://deno.land/x/debuglog@v1.0.0/debug.ts';

/**
 * Validates the API Response
 * @param result The Result
 * @returns The Data
 */
export function validateResponse<T = Obj>(result: IValidateResponse): IResult<T> {
  debug('validateResponse')('Validating Response');
  switch (result.data.status) {
    case STATUS.AUTHENTICATION_FAILED:
      throw new APIError('Authentication failed', result.data);
    case STATUS.AUTH_TOKEN_INVALID:
      throw new APIError('Auth Token invalid', result.data);
    case STATUS.BUILD_ERROR:
      throw new APIError('Build Error', result.data);
    case STATUS.ERROR_ALREADY_EXIST:
      throw new APIError('Already exist', result.data);
    case STATUS.ERROR_BAD_NAME:
      throw new APIError('Bad name', result.data);
    case STATUS.ERROR_CAPTAIN_NOT_INITIALIZED:
      throw new APIError('Captain not initialized', result.data);
    case STATUS.ERROR_GENERIC:
      throw new APIError('Generic', result.data);
    case STATUS.ERROR_NOT_AUTHORIZED:
      throw new APIError('Not authorized', result.data);
    case STATUS.ERROR_USER_NOT_INITIALIZED:
      throw new APIError('User not initialized', result.data);
    case STATUS.ILLEGAL_OPERATION:
      throw new APIError('Illegal operation', result.data);
    case STATUS.ILLEGAL_PARAMETER:
      throw new APIError('Illegal parameter', result.data);
    case STATUS.NOT_FOUND:
      throw new APIError('Not found', result.data);
    case STATUS.OK:
      return result.data as IResult<T>;
    case STATUS.OK_DEPLOY_STARTED:
      return result.data as IResult<T>;
    case STATUS.OK_PARTIALLY:
      return result.data as IResult<T>;
    case STATUS.PASSWORD_BACK_OFF:
      throw new APIError('Password back off', result.data);
    case STATUS.VERIFICATION_FAILED:
      throw new APIError('Verification failed', result.data);
    case STATUS.WRONG_PASSWORD:
      throw new APIError('Wrong password', result.data);
    default:
      throw new APIError('Not a valid response!', result.data);
  }
}

interface IValidateResponse extends Omit<IAxiodResponse, 'headers' | 'config'> {
  data: IResult;
}

export enum STATUS {
  ERROR_GENERIC = 1000,
  OK = 100,
  OK_DEPLOY_STARTED = 101,
  OK_PARTIALLY = 102,
  ERROR_CAPTAIN_NOT_INITIALIZED = 1001,
  ERROR_USER_NOT_INITIALIZED = 1101,
  ERROR_NOT_AUTHORIZED = 1102,
  ERROR_ALREADY_EXIST = 1103,
  ERROR_BAD_NAME = 1104,
  WRONG_PASSWORD = 1105,
  AUTH_TOKEN_INVALID = 1106,
  VERIFICATION_FAILED = 1107,
  ILLEGAL_OPERATION = 1108,
  BUILD_ERROR = 1109,
  ILLEGAL_PARAMETER = 1110,
  NOT_FOUND = 1111,
  AUTHENTICATION_FAILED = 1112,
  PASSWORD_BACK_OFF = 1113
}

export enum PATHS {
  LOGIN = '/login',
  SYSTEM_INFO = '/user/system/info',
  APP_LIST = '/user/apps/appDefinitions',
  APP_REGISTER = '/user/apps/appDefinitions/register',
  APP_DELETE = '/user/apps/appDefinitions/delete',
  ADD_CUSTOM_DOMAIN = '/user/apps/appDefinitions/customdomain',
  UPDATE_APP = '/user/apps/appDefinitions/update',
  ENABLE_SSL = '/user/apps/appDefinitions/enablecustomdomainssl',
  APP_DATA = '/user/apps/appData',
  CREATE_BACKUP = '/user/system/createbackup',
  DOWNLOAD_BACKUP = '/downloads/',
  REPOSITORIES = '/user/oneclick/repositories/',
  ONECLICK_LIST = '/user/oneclick/template/list'
}

export interface IResult<T = Obj> {
  status: STATUS;
  description: string;
  data: T;
}

// deno-lint-ignore no-explicit-any
export type Obj = Record<string, any>;

/** API Result Types */

// System Info
export interface SystemInfo {
  hasRootSsl: boolean;
  forceSsl: boolean;
  rootDomain: string;
}

// App List
export interface AppList {
  appDefinitions: AppDefinition[];
  rootDomain: string;
  defaultNginxConfig: string;
}

export interface AppDefinition {
  hasPersistentData: boolean;
  description: string;
  instanceCount: number;
  captainDefinitionRelativeFilePath: string;
  networks: string[];
  envVars: EnvVar[];
  volumes: Volume[];
  ports: Port[];
  versions: Version[];
  deployedVersion: number;
  notExposeAsWebApp: boolean;
  customDomain: CustomDomain[];
  hasDefaultSubDomainSsl: boolean;
  forceSsl: boolean;
  websocketSupport: boolean;
  containerHttpPort: number;
  preDeployFunction: string;
  serviceUpdateOverride: string;
  customNginxConfig?: string;
  appName: string;
  isAppBuilding: boolean;
  appPushWebhook?: AppPushWebhook;
  nodeId?: string;
}

export interface AppPushWebhook {
  tokenVersion: string;
  pushWebhookToken: string;
  repoInfo: RepoInfo;
}

export interface RepoInfo {
  repo: string;
  user: string;
  password: string;
  sshKey: string;
  branch: string;
}

export interface CustomDomain {
  publicDomain: string;
  hasSsl: boolean;
}

export interface EnvVar {
  key: string;
  value: string;
}

export interface Port {
  hostPort: number;
  containerPort: number;
}

export interface Version {
  version: number;
  timeStamp: string;
  deployedImageName?: string;
  gitHash?: string;
}

export interface Volume {
  containerPath: string;
  volumeName?: string;
  hostPath?: string;
}

// App Info
export interface AppInfo {
  isAppBuilding: boolean;
  logs: Logs;
  isBuildFailed: boolean;
}

export interface Logs {
  lines: string[];
  firstLineNumber: number;
}

// Create App
export type AppCreate<T extends boolean> = T extends true
  ? Promise<AppInfo>
  : T extends false
  ? Promise<IAxiodResponse>
  : never;

// Delete App
export interface AppDeleteParams {
  appName: string;
  volumes?: Volume[];
}

// Create Backup
export interface BackupCreate {
  downloadToken: string;
}

// Resolve App Variables
export interface AppVariablesResolve {
  captainVersion: number;
  services: Record<string, CapApp>;
  caproverOneClickApp: CaproverOneClickApp;
}

export interface CaproverOneClickApp {
  variables: Variable[];
  instructions: Instructions;
  displayName: string;
  isOfficial: boolean;
  description: string;
  documentation: string;
}

export interface Instructions {
  start: string;
  end: string;
}

export interface Variable {
  id: string;
  label: string;
  defaultValue: string;
  description: string;
  validRegex?: string;
}

export interface CapApp {
  // deno-lint-ignore camelcase
  depends_on?: string[];
  image?: string;
  volumes?: string[];
  restart: string;
  environment?: Record<string, string>;
  caproverExtra: CapAppCaproverExtra;
}

export interface CapAppCaproverExtra {
  containerHttpPort?: string;
  notExposeAsWebApp?: string;
  dockerfileLines?: string[];
}

// Get Logs
export interface AppLogs {
  logs: string;
}

export type AppLogsEncoding =
  | 'ascii'
  | 'utf8'
  | 'utf-8'
  | 'utf16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'base64url'
  | 'latin1'
  | 'binary'
  | 'hex';

// One Click Apps List
export interface OneClickAppsList {
  oneClickApps: OneClickApp[];
}

export interface OneClickApp {
  baseUrl: string;
  name: string;
  displayName: string;
  isOfficial: boolean;
  description: string;
  logoUrl: string;
}
