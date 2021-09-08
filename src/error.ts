import { IResult, STATUS } from './api.ts';
import debug from 'https://deno.land/x/debuglog@v1.0.0/debug.ts';

class BaseError {
  // deno-lint-ignore no-explicit-any
  constructor(errotype: any) {
    // deno-lint-ignore no-explicit-any
    Error.apply(this, arguments as any);
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, errotype.prototype);
  }
}

export class APIError extends BaseError {
  public readonly status: STATUS;
  public readonly description: string;
  constructor(public readonly message: string, result: IResult) {
    super(APIError);
    debug('APIError')('Caught');
    this.status = result.status;
    this.description = result.description;
  }
}

export class OSError extends BaseError {
  public readonly message: string;
  public readonly cause: string;
  public readonly reason: string;
  constructor(public readonly errorCode: number, errorText: string) {
    super(OSError);
    debug('OSError')('Caught');
    this.cause = errorText.split(': ')[0];
    this.message = errorText.split(': ')[1] + ' - ' + errorText.split(': ')[3].split('. (')[0];
    this.reason = errorText.split(': ')[2];
  }
}
