// httpStatusEnum.js

const HttpStatus = Object.freeze({
  // --- Success Responses ---
  OK: 200,
  SUCCESS: 200,
  SUCCESSFULLY_UPDATED: 200,
  SUCCESSFULLY_DELETED: 200,
  SUCCESSFULLY_CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // --- Client Error Responses ---
  BAD_REQUEST: 400,
  INVALID_REQUEST: 400,
  CREATION_FAILED: 400,
  UPDATE_FAILED: 400,
  UNPROCESSABLE_ENTITY: 422,
  REQUEST_TIMEOUT: 408,
  UNAUTHORIZED: 401,
  LOGIN_ERROR: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  ACCESS_DENIED: 403,
  PAGE_NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,

  // --- Server Error Responses ---
  SERVER_ERROR: 500,
  INTERNAL_SERVER_ERROR: 500,
  DATABASE_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,

  // --- Other Useful Codes ---
  PARTIAL_CONTENT: 206,
  ALREADY_REPORTED: 208, // WebDAV; resource already reported
  IM_A_TEAPOT: 418, // Easter Egg code
  MISDIRECTED_REQUEST: 421,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  UPGRADE_REQUIRED: 426,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
});

// module.exports = HttpStatus;
export default HttpStatus;
