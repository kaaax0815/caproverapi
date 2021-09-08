import axiod from 'https://deno.land/x/axiod@0.22/mod.ts';
import {
  parse as YAMLparse,
  stringify as YAMLstringify
} from 'https://deno.land/std@0.106.0/encoding/yaml.ts';
const YAML = { stringify: YAMLstringify, parse: YAMLparse };
import debug from 'https://deno.land/x/debuglog@v1.0.0/debug.ts';
import { EventEmitter } from 'https://deno.land/x/event_emitter@1.0.0/mod.ts';
import { processLog } from './utils.ts';
import Ask from 'https://deno.land/x/ask@1.0.6/mod.ts';

import {
  AppCreate,
  AppDefinition,
  AppDeleteParams,
  AppInfo,
  AppList,
  AppLogs,
  AppLogsEncoding,
  AppVariablesResolve,
  BackupCreate,
  OneClickAppsList,
  PATHS,
  RepoInfo,
  SystemInfo,
  validateResponse
} from './api.ts';

import { Catch, ConnectionErrors } from './network.ts';

import { arraysMatch, generateRandomHexString, includesAll } from './utils.ts';

class CapRover {
  protected address: string;
  protected password: string;
  protected protocol: PROTOCOLS;
  protected namespace: string;
  token: string;
  protected headers: IHeaders;
  readonly appsPath =
    'https://raw.githubusercontent.com/caprover/one-click-apps/master/public/v4/apps/';

  protected constructor(constructor: IContructor) {
    this.address = constructor.address;
    this.password = constructor.password;
    this.protocol = constructor.protocol;
    this.namespace = constructor.namespace;
    this.token = constructor.token;
    this.headers = constructor.headers;
    debug('constructor')('Created new CapRover Instance');
  }

  /**
   * Build the right Headers for the API
   */
  protected buildHeaders(): IHeaders {
    debug('buildHeaders')('Built Headers');
    return {
      'content-type': 'application/json;charset=UTF-8',
      accept: 'application/json, text/plain, */*',
      'x-namespace': this.namespace,
      'x-captain-auth': this.token
    };
  }

  /**
   * Build full URL to the API
   * @param endpoint The API Endpoint
   * @returns Full URL
   */
  protected buildURL(endpoint: PATHS): string {
    debug('buildURL')('Built URL for Endpoint', endpoint);
    return `${this.protocol}${this.address}/api/v2${endpoint}`;
  }

  /**
   * Build full URL to the API
   * @param endpoint The API Endpoint
   * @param opts The Options
   * @returns Full URL
   */
  protected static buildURL(endpoint: PATHS, opts: Full<ICreate>): string {
    debug('static:buildURL')('Built URL for Endpoint', endpoint);
    return `${opts.protocol}${opts.address}/api/v2${endpoint}`;
  }

  /**
   * Get CapRover API Token
   * @param opts The Options
   * @returns The Token
   */
  protected static async getToken(opts: Omit<Full<IContructor>, 'token'>): Promise<string> {
    const result = await axiod.post(
      CapRover.buildURL(PATHS.LOGIN, opts),
      { password: opts.password },
      { headers: opts.headers }
    );
    const data = validateResponse(result);
    debug('getToken')('Got Token');
    return data.data.token;
  }

  /**
   * Get System Info
   * @returns System Info
   */
  async getSystemInfo() {
    const result = await axiod.get(this.buildURL(PATHS.SYSTEM_INFO), {
      headers: this.headers
    });
    const data = validateResponse<SystemInfo>(result);
    debug('getSystemInfo')('Got System Info');
    return data.data;
  }

  /**
   * Get App Info
   * @param appName The App Name
   * @returns App Info
   */
  async getAppInfo(appName: string) {
    const result = await axiod.get(this.buildURL(PATHS.APP_DATA) + `/${appName}`, {
      headers: this.headers
    });
    const data = validateResponse<AppInfo>(result);
    debug('getAppInfo')('Got App Info about:', appName);
    return data.data;
  }

  /**
   * Get App List
   * @returns App List
   */
  async listApps() {
    const result = await axiod.get(this.buildURL(PATHS.APP_LIST), {
      headers: this.headers
    });
    const data = validateResponse<AppList>(result);
    debug('listApps')('Got', data.data.appDefinitions.length, 'Apps');
    return data.data;
  }

  /**
   * Get App Data
   * @param appName The App Name
   * @returns App Data
   */
  async getAppData(appName: string) {
    const result = await this.listApps();
    const app = result.appDefinitions.find((v) => v.appName === appName);
    debug('getAppData')('Got App Data about:', app?.appName);
    return app;
  }

  /**
   * Wait until App is Ready or Timeout
   * @param appName The App Name
   * @param timeout Timeout in seconds. Default: `60`
   */
  protected waitUntilAppReady(appName: string, timeout = 60): Promise<AppInfo> {
    debug('waitUntilAppReady')('Waiting until', appName, 'is ready');
    return new Promise((resolve, reject) => {
      let timeoutMS = timeout * 1000;
      const int = setInterval(async () => {
        timeoutMS -= 1000;
        const result = await this.getAppInfo(appName);
        if (!result.isAppBuilding) {
          clearInterval(int);
          debug('waitUntilAppReady')(appName, 'is ready');
          return resolve(result);
        }
        if (timeoutMS <= 0) {
          clearInterval(int);
          debug('waitUntilAppReady')('Exceeded timeout');
          return reject('App building timeout exceeded');
        }
      }, 1000);
    });
  }

  /**
   * Create App
   * @param appName The App Name
   * @param hasPersistentData Should the App have persistent data. Default: `false`
   * @param waitForAppBuild Should the App be built before returning. Default: `true`
   * @returns App Info
   */
  async createApp<T extends boolean = true>(
    appName: string,
    hasPersistentData = false,
    waitForAppBuild?: T
  ): Promise<AppCreate<T>> {
    const data = { appName, hasPersistentData };
    const params = { detached: 1 };
    const result = await axiod.post(this.buildURL(PATHS.APP_REGISTER), data, {
      headers: this.headers,
      params
    });
    debug('createApp')('Created App', data);
    if (waitForAppBuild) {
      const appInfo = await this.waitUntilAppReady(appName);
      return appInfo;
    }
    return result;
  }

  /**
   * Delete App
   * @param appName The App Name or Pattern
   * @param deleteVolumes Should the volumes be deleted. Default: `false`
   * @returns Empty Object
   */
  async deleteApp(appName: string, deleteVolumes = false) {
    const data = { appName } as AppDeleteParams;
    if (deleteVolumes) {
      const app = await this.getAppData(appName);
      data.volumes = app?.volumes;
    }
    const result = await axiod.post(this.buildURL(PATHS.APP_DELETE), data, {
      headers: this.headers
    });
    const resultData = validateResponse<NoObj>(result);
    debug('deleteApp')('Deleted App', data);
    return resultData.data;
  }

  /**
   * Delete all Apps matching Pattern
   * @param pattern The Pattern
   * @param deleteVolumes Should the volumes be deleted. Default: `false`
   * @returns Empty Object
   */
  async deleteAppsMatchingPattern(pattern: RegExp, deleteVolumes = false) {
    const appList = await this.listApps();
    for (const app of appList.appDefinitions) {
      if (app.appName.match(pattern)) {
        await this.deleteApp(app.appName, deleteVolumes);
        await this.delay(200);
      }
    }
    const data = validateResponse({
      status: 200,
      statusText: 'OK',
      data: {
        status: 100,
        description: `Deleted all Apps matching ${pattern.toString()}`,
        data: {}
      }
    });
    return data.data;
  }

  /**
   * Add Custom Domain to App
   * @param appName The App Name
   * @param customDomain The Custom Domain
   * @returns Empty Object
   */
  async addDomain(appName: string, customDomain: string) {
    const data = { appName, customDomain };
    const result = await axiod.post(this.buildURL(PATHS.ADD_CUSTOM_DOMAIN), data, {
      headers: this.headers
    });
    const resultData = validateResponse<NoObj>(result);
    debug('addDomain')('Added Domain', data.customDomain, 'to App', data.appName);
    return resultData.data;
  }

  /**
   * Enable SSL for Custom Domain in App
   * @param appName The App Name
   * @param customDomain The Custom Domain
   * @returns Empty Object
   */
  async enableSSL(appName: string, customDomain: string) {
    const data = { appName, customDomain };
    const result = await axiod.post(this.buildURL(PATHS.ENABLE_SSL), data, {
      headers: this.headers
    });
    const resultData = validateResponse<NoObj>(result);
    debug('enableSSL')('Enabled SSL for', data.customDomain, 'on App', data.appName);
    return resultData.data;
  }

  /**
   * Create Backup
   * @param postDownloadFileName The Post Download File Name
   * @returns Download Token
   */
  protected async createBackup(postDownloadFileName: string) {
    const data = { postDownloadFileName };
    const result = await axiod.post(this.buildURL(PATHS.CREATE_BACKUP), data, {
      headers: this.headers
    });
    const resultData = validateResponse<BackupCreate>(result);
    debug('createBackup')('Created Backup:', resultData.data.downloadToken);
    return resultData.data;
  }

  /**
   * Download Backup
   * @param downloadToken The Download Token
   * @param fileName The File name
   * @returns Nothing
   */
  protected async downloadBackup(downloadToken: string, fileName: string) {
    const params = { downloadToken, namespace: this.namespace };
    const result = await axiod.get(this.buildURL(PATHS.DOWNLOAD_BACKUP), {
      headers: this.headers,
      params
    });
    if (result.status === 200) {
      const data = new TextEncoder().encode(result.data);
      await Deno.writeFile(`./${fileName}`, data);
      debug('downloadBackup')('Wrote Backup to', fileName);
      return;
    } else {
      throw new Error('Error downloading backup');
    }
  }

  /**
   * Create and Download Backup
   * @param fileName The file name. `null` automatically creates a file name
   * @returns Nothing
   */
  async createAndDownloadBackup(fileName: string | null) {
    if (fileName === null) {
      const date = new Date();
      fileName = `${this.namespace}-bck-${date.getUTCFullYear()}-${
        date.getUTCMonth() + 1
      }-${date.getUTCDay()} ${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}.rar`;
    }
    const backupData = await this.createBackup(fileName);
    const downloadToken = backupData.downloadToken;
    return this.downloadBackup(downloadToken, fileName);
  }

  /**
   * Update App Data
   * @param appName The App Name
   * @param options The Options
   * @returns Empty Object
   * @warning It overwrites the existing data. If you set e.g. `ports`, it will overwrite the existing ones.
   * @example ````Update App
   ```typescript
   await capRover.updateAppData('test', {
    instanceCount: 0,
    containerHttpPort: 8080
  });
   ```
   */
  async updateAppData(options: IUpdateAppData) {
    const appPushWebhook = { repoInfo: options.repoInfo };
    const _data = { ...options, repoInfo: undefined, appPushWebhook };
    const result = await axiod.post(this.buildURL(PATHS.UPDATE_APP), _data, {
      headers: this.headers
    });
    const data = validateResponse<NoObj>(result);
    debug('updateAppData')('Updated App', options.appName);
    return data.data;
  }

  /**
   * If Build is not failed
   * @param appName The App Name
   * @returns App Info
   */
  protected async ensureBuildSuccess(appName: string) {
    const appInfo = await this.getAppInfo(appName);
    if (appInfo.isBuildFailed) {
      throw new Error('Build failed');
    }
    debug('ensureBuildSuccess')('Build for App', appName, 'is not failed');
    return appInfo;
  }

  /**
   * Deploy Docker File or Docker Image
   * @param appName The App Name
   * @param type `dockerfile` or `dockerimage`
   * @param content Dockerfile or Docker Image
   * @important The App must exist
   * @returns Empty Object
   */
  async deployNow(appName: string, type: 'dockerfile' | 'dockerimage', content: string | string[]) {
    const data = {
      captainDefinitionContent: JSON.stringify({
        schemaVersion: 2,
        imageName: content
      }),
      gitHash: ''
    };
    if (type === 'dockerfile') {
      data.captainDefinitionContent = JSON.stringify({
        schemaVersion: 2,
        dockerfileLines: content
      });
    }
    const result = await axiod.post(this.buildURL(PATHS.APP_DATA) + `/${appName}`, data, {
      headers: this.headers
    });
    const resultData = validateResponse(result);
    await this.waitUntilAppReady(appName);
    await this.delay(500);
    await this.ensureBuildSuccess(appName);
    debug('deployNow')('Deployed', content, 'on App', appName);
    return resultData.data;
  }

  /**
   * Delay `ms` ms
   * @param ms Delay in milliseconds
   */
  protected delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getLogsAsEvent(appName: string) {
    return new (class extends EventEmitter<{ log: (log: string) => Promise<unknown> | unknown }> {
      private alreadyLogged: string[] = [];
      constructor(public superThis: CapRover, appName: string) {
        super();
        this.log(appName);
      }
      private log(appName: string) {
        setInterval(async () => {
          const log = await this.superThis.getAppLogs(appName, 'hex');
          const processedLog = processLog(log.logs)
            .split('\n')
            .filter((v) => !this.alreadyLogged.includes(v));
          if (processedLog.length > 0) {
            this.alreadyLogged.push(...processedLog);
            this.emit('log', processedLog.join('\n'));
          }
        }, 200);
      }
    })(this, appName);
  }

  /**
   * Resolve App Variables
   * @param oneClickAppName The One Click App Name
   * @param capAppName The Cap App Name
   * @param appVariables The App Variables
   * @param automated Automated Deployment. Set to false if you want to interactively set variables. Default: `true`
   * @returns YAML File with correct variables
   */
  protected async resolveAppVariables(
    oneClickAppName: string,
    capAppName: string,
    appVariables: Record<string, string>,
    automated = true
  ) {
    debug('resolveAppVariables')('Resolving', appVariables, 'for', oneClickAppName);
    // Check if One Click Apps exists
    const oneClickAppsResult = await axiod.get(this.buildURL(PATHS.ONECLICK_LIST), {
      headers: this.headers
    });
    const oneClickApps = validateResponse<OneClickAppsList>(oneClickAppsResult).data.oneClickApps;
    const oneClickApp = oneClickApps.find((app) => app.name === oneClickAppName);
    if (!oneClickApp) {
      throw new Error(`OneClick App ${oneClickAppName} not found`);
    }

    // Get raw YAML File
    let rawAppData = (await axiod.get(this.appsPath + `${oneClickAppName}.yml`)).data as string;
    appVariables['$$cap_appname'] = capAppName;
    appVariables['$$cap_root_domain'] = (await this.getSystemInfo()).rootDomain;
    const appData = YAML.parse(rawAppData) as AppVariablesResolve;
    const variables = appData.caproverOneClickApp.variables;
    for (const variable of variables) {
      let defaultValue = variable.defaultValue.toString() || '';
      const regex = variable.validRegex?.match(/(\/?)(.+)\1([a-z]*)/i);
      if (regex === null) {
        throw new Error('Invalid RegEx');
      }
      const validRegex = new RegExp((regex && regex[2]) || '.*');
      let value = appVariables[variable.id];
      const isRandomHex = defaultValue.match(/\$\$cap_gen_random_hex\((\d+)\)/);
      if (isRandomHex !== null) {
        defaultValue = generateRandomHexString(parseInt(isRandomHex[1]));
      }
      if (!automated) {
        const ask = new Ask();
        if (!value || !validRegex.test(defaultValue)) {
          const result = await ask.prompt([
            {
              name: variable.id,
              message: variable.label + ' : ' + (variable.description || ''),
              validate: (v) => (v ? validRegex.test(v) : false),
              default: defaultValue
            }
          ]);
          if (result[variable.id] != null) {
            debug('resolveAppVariables')(`${variable.id} : ${result[variable.id]}`);
            value = result[variable.id]!.toString();
          }
        }
      }
      if (!defaultValue && !value) {
        // if defaultValue or value is not set throw error
        throw new Error(`Variable ${variable.id} is required`);
      } else if (!value && validRegex.test(defaultValue)) {
        // if value is not set but defaultValue is good use defaultValue
        appVariables[variable.id] = defaultValue;
      } else if (value && !validRegex.test(value)) {
        // if value is set and is not good throw error
        throw new Error(`Invalid value for variable ${variable.id}`);
      } else if (!value && !validRegex.test(defaultValue)) {
        // if value is not set and defaultValue is not good throw error
        throw new Error(`Variable ${variable.id} is required`);
      } else if (value && validRegex.test(value)) {
        // if value is set and is good use value
        appVariables[variable.id] = value;
      }
    }

    // Replace Variables in YAML File with their correct value
    for (const [id, value] of Object.entries(appVariables)) {
      debug('resolveAppVariables')(`${id} : ${value}`);
      rawAppData = rawAppData.replaceAll(id, value);
    }
    debug('resolveAppVariables')('Resolved', appVariables, 'for', oneClickAppName);
    // Return YAML File with correct variables
    return rawAppData;
  }

  /**
   * Deploy One Click App
   * @param oneClickAppName The One Click App Name
   * @param namespace Create all dependant apps under namespace
   * @param appVariables The App Variables
   * @param automated Automated Deployment. Set to false if you want to interactively set variables. Default: `true`
   * @returns Unknown
   */
  async deployOneClickApp(
    oneClickAppName: string,
    namespace: string,
    appVariables: Record<string, string>,
    automated = true
  ) {
    const capAppName = `${namespace}-${oneClickAppName}`;
    const resolvedAppData = await this.resolveAppVariables(
      oneClickAppName,
      capAppName,
      appVariables,
      automated
    );
    const appData = YAML.parse(resolvedAppData) as AppVariablesResolve;
    const services = appData.services;
    const appsToDeploy = Object.keys(services);
    const appsDeployed: string[] = [];
    do {
      for (const [serviceName, serviceData] of Object.entries(services)) {
        debug('deployOneClickApp')('Deploying', serviceName);
        const dependsOn = serviceData.depends_on || [];
        // app already deployed
        if (appsDeployed.includes(serviceName)) {
          continue;
        }
        // if not all dependencies are deployed, skip
        if (!includesAll(appsDeployed, dependsOn)) {
          continue;
        }
        const hasPersistentData = !!serviceData.volumes;
        const volumes = (serviceData.volumes || []).map((v) => {
          const splitted = v.split(':');
          const labelOrHost = splitted[0];
          const path = splitted[1];
          if (labelOrHost.startsWith('/')) {
            return {
              hostPath: labelOrHost,
              containerPath: path
            };
          }
          return { volumeName: labelOrHost, containerPath: path };
        });
        const envVars =
          Object.entries(serviceData.environment || {}).map((v) => ({
            key: v[0],
            value: v[1]
          })) || [];
        const caproverExtras = serviceData.caproverExtra || {};
        const notExposeAsWebApp = caproverExtras.notExposeAsWebApp === 'true' ? true : false;
        const containerHttpPort = Number.parseInt(caproverExtras.containerHttpPort || '80');

        // create app
        await this.createApp(serviceName, hasPersistentData);

        await this.waitUntilAppReady(serviceName);

        // update app
        await this.updateAppData({
          appName: serviceName,
          instanceCount: 1,
          volumes,
          envVars,
          notExposeAsWebApp,
          containerHttpPort
        });

        const imageName = serviceData.image;
        const dockerFileLines = caproverExtras.dockerfileLines;

        await this.deployNow(
          serviceName,
          imageName ? 'dockerimage' : 'dockerfile',
          imageName || dockerFileLines || ''
        );

        appsDeployed.push(serviceName);

        debug('deployOneClickApp')('Deployed', serviceName);
      }
    } while (!arraysMatch(appsDeployed, appsToDeploy));
    const data = validateResponse({
      status: 200,
      statusText: 'OK',
      data: {
        status: 100,
        description: `Deployed all Apps in ${oneClickAppName}`,
        data: {}
      }
    });
    debug('deployOneClickApp')('Deployed One Click App', oneClickAppName);
    return data;
  }

  /**
   * Get App Logs
   * @param appName The App Name
   * @param encoding The Encoding
   * @returns Logs
   */
  async getAppLogs(appName: string, encoding: AppLogsEncoding = 'utf-8') {
    const result = await axiod.get(
      this.buildURL(PATHS.APP_DATA) + `/${appName}/logs?encoding=${encoding}`,
      { headers: this.headers }
    );
    const data = validateResponse<AppLogs>(result);
    debug('getAppLogs')('Got App Logs for', appName, 'with', encoding, 'Encoding');
    return data.data;
  }

  /** Create a CapRover Instance */
  @Catch(ConnectionErrors)
  static async login({
    address,
    password,
    protocol,
    namespace = 'captain'
  }: ICreate): Promise<CapRover> {
    const opts = { address, password, protocol, namespace };
    debug('login')('Loggin in to', address);
    const loginHeaders = {
      'content-type': 'application/json;charset=UTF-8',
      accept: 'application/json, text/plain, */*',
      'x-namespace': namespace
    } as IHeaders;
    const token = await CapRover.getToken({ ...opts, headers: loginHeaders });
    const headers = { ...loginHeaders, 'X-Captain-Auth': token };
    return new CapRover({ ...opts, token, headers });
  }
}

export interface ICreate {
  /**
   * Address without Protocol
   * @example 'captain.test.example.com'
   */
  address: string;
  password: string;
  protocol: PROTOCOLS;
  /**
   * Captain Namespace
   * @default 'captain'
   */
  namespace?: string;
}

export interface IContructor extends Full<ICreate> {
  token: string;
  headers: IHeaders;
}

export type Full<T> = {
  [P in keyof T]-?: T[P];
};

export enum PROTOCOLS {
  HTTP = 'http://',
  HTTPS = 'https://'
}

export type IUpdateAppData = Partial<
  Omit<
    AppDefinition,
    | 'appName'
    | 'deployedVersion'
    | 'hasDefaultSubDomainSsl'
    | 'isAppBuilding'
    | 'hasPersistentData'
    | 'networks'
    | 'versions'
    | 'appPushWebhook'
  > & { repoInfo: RepoInfo }
> & { appName: string };

export interface IHeaders {
  'content-type': string;
  accept: string;
  'x-captain-auth': string;
  'x-namespace': string;
}

export type NoObj = Record<string, never>;

export default CapRover;
