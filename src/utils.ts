import { crypto } from 'https://deno.land/std@0.106.0/crypto/mod.ts';

/**
 * Generate random hex string with `bytes` bytes
 * @param bytes Bytes
 */
export function generateRandomHexString(bytes: number): string {
  const byteArray = new Uint8Array(bytes);
  const randomBytes = Array.from(crypto.getRandomValues(byteArray));
  const hexArray = randomBytes.map((byte) => ('0' + (byte & 0xff).toString(16)).slice(-2));
  return hexArray.join('');
}

/**
 * If arrays match
 * @param arr1 Array 1
 * @param arr2 Array 2
 * @param sort Whether to sort the arrays before comparing. Default: `true`
 */
export function arraysMatch(arr1: unknown[], arr2: unknown[], sort = true) {
  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) return false;

  if (sort) {
    arr1.sort();
    arr2.sort();
  }

  // Check if all items exist and are in the same order
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  // Otherwise, return true
  return true;
}

/**
 * If `arr` includes every item in `target` return true.
 * @param arr Input Array
 * @param target Target Array
 */
export function includesAll(arr: string[], target: string[]) {
  return target.every((v) => arr.includes(v));
}

/**
 * Process Logs
 * @param str Hex Input string
 */
export function processLog(logs: string) {
  const separators = [
    '00000000',
    '01000000',
    '02000000',
    '03000000' // This is not in the Docker docs, but can actually happen when the log stream is broken https://github.com/caprover/caprover/issues/366
  ];
  const logsProcessed = logs
    .split(new RegExp(separators.join('|'), 'g'))
    .map((rawRow) => {
      let time = 0;

      const textUtf8 = convertHexStringToUtf8(rawRow);

      try {
        time = new Date(textUtf8.substring(0, 30)).getTime();
      } catch (_err) {
        // it's just a failure in fetching logs. Ignore to avoid additional noise in console
      }

      return {
        text: textUtf8,
        time: time
      };
    })
    .sort((a, b) => (a.time > b.time ? 1 : b.time > a.time ? -1 : 0))
    .map((a) => {
      return a.text;
    })
    .join('')
    .replace(getAnsiColorRegex(), '');
  return logsProcessed;
}

function getAnsiColorRegex() {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  ].join('|');
  return new RegExp(pattern, 'g');
}

function convertHexStringToUtf8(raw: string) {
  if (raw) {
    try {
      return decodeURIComponent(
        raw
          .substring(8, raw.length)
          .replace(/\s+/g, '')
          .replace(/[0-9a-f]{2}/g, '%$&')
      );
    } catch {
      throw new Error('Your Log has to be HEX encoded');
    }
  } else {
    return '';
  }
}
