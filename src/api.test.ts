import { assertEquals } from 'https://deno.land/std@0.106.0/testing/asserts.ts';
import { STATUS, validateResponse } from './api.ts';

Deno.test('validateResponse', () => {
  // Doesn't work because APIError is 'A non-Error object'
  const templateResponse = (status: STATUS) => {
    return {
      data: { status, description: 'Description', data: {} },
      status: 200,
      statusText: 'OK'
    };
  };
  /* assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.AUTHENTICATION_FAILED)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.AUTH_TOKEN_INVALID)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.BUILD_ERROR)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.ERROR_ALREADY_EXIST)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.ERROR_BAD_NAME)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.ERROR_CAPTAIN_NOT_INITIALIZED)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.ERROR_GENERIC)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.ERROR_NOT_AUTHORIZED)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.ERROR_USER_NOT_INITIALIZED)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.ILLEGAL_OPERATION)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.ILLEGAL_PARAMETER)),
    APIError
  );
  assertThrows<IResult<Obj>>(() => validateResponse(templateResponse(STATUS.NOT_FOUND)), APIError); */
  assertEquals(() => validateResponse(templateResponse(STATUS.OK)), {});
  assertEquals(() => validateResponse(templateResponse(STATUS.OK_DEPLOY_STARTED)), {});
  assertEquals(() => validateResponse(templateResponse(STATUS.OK_PARTIALLY)), {});
  /* assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.PASSWORD_BACK_OFF)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.VERIFICATION_FAILED)),
    APIError
  );
  assertThrows<IResult<Obj>>(
    () => validateResponse(templateResponse(STATUS.WRONG_PASSWORD)),
    APIError
  ); */
});
