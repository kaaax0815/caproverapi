// deno-lint-ignore-file no-explicit-any
import { OSError } from "./error.ts";
import debug from "https://deno.land/x/debuglog@v1.0.0/debug.ts";

export type HandlerFunction = (osError: number[], ctx: any) => void;

export const Catch = (osError: number[]): any => {
  return (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    // Save a reference to the original method
    const originalMethod = descriptor.value;

    // Rewrite original method with try/catch wrapper
    descriptor.value = function (...args: any[]) {
      try {
        const result = originalMethod.apply(this, args);

        // Check if method is asynchronous
        if (result && result instanceof Promise) {
          // Return promise
          return result.catch((error: any) => {
            _handleError(this, osError, error);
          });
        }

        // Return actual result
        return result;
      } catch (error) {
        _handleError(this, osError, error);
      }
    };

    return descriptor;
  };
};

function _handleError(_ctx: any, osError: number[], error: Error) {
  // Check if error is instance of given error type
  const parsedError = parseError(error);
  if (parsedError && osError.includes(parsedError)) {
    throw new OSError(parsedError, error.message);
  } else {
    debug("@Catch")("Caught error that is not included");
    // Throw error further
    // Next decorator in chain can catch it
    throw error;
  }
}

function parseError(error: Error) {
  const osError = error.message.match(/.*\(os error ([0-9]+)\)/);
  if (osError === null) {
    return null;
  }
  return Number.parseInt(osError[1]);
}

/** Only for Windows */
export enum WindowsOSErrors {
  NO_SUCH_HOST_IS_KNOWN = 11001,
}

/** Only works on Windows */
export const ConnectionErrors = [WindowsOSErrors.NO_SUCH_HOST_IS_KNOWN];
