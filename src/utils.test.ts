import { assertEquals, assertThrows } from 'https://deno.land/std@0.106.0/testing/asserts.ts';

import { generateRandomHexString, arraysMatch, includesAll, processLog } from './utils.ts';

Deno.test('generateRandomHexString', () => {
  const hexString32 = generateRandomHexString(32);
  const byteArray32 = new TextEncoder().encode(hexString32);
  assertEquals(byteArray32.length, 64);
  const hexString12 = generateRandomHexString(12);
  const byteArray12 = new TextEncoder().encode(hexString12);
  assertEquals(byteArray12.length, 24);
});

Deno.test('arraysMatch', () => {
  const array1 = [1, 2, 3, 4, 5];
  const array2 = [1, 2, 3, 5, 4];
  const array3 = [1, 2, 3, 4, 6];
  const array4 = [1, 2, 3, 4];
  assertEquals(arraysMatch(array1, array1), true);
  assertEquals(arraysMatch(array1, array2), true);
  assertEquals(arraysMatch(array1, array3), false);
  assertEquals(arraysMatch(array1, array4), false);
});

Deno.test('includesAll', () => {
  const array1 = ['1', '2', '3', '4', '5'];
  const array2 = ['1', '2', '3', '4'];
  assertEquals(includesAll(array1, array1), true);
  assertEquals(includesAll(array1, array2), true);
  assertEquals(includesAll(array2, array1), false);
});

Deno.test('processLog', () => {
  assertThrows(() =>
    processLog(
      (Math.random() + 1).toString(36).substring(2) +
        (Math.random() + 1).toString(36).substring(2) +
        (Math.random() + 1).toString(36).substring(2)
    )
  );
  assertEquals(processLog('72616e646f6d2074657874'), 'random text'.substring(4));
});
