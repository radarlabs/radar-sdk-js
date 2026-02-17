import type { RadarResponse } from './http';

/** base error class for all Radar SDK errors */
export abstract class RadarError extends Error {
  /** legacy status code string (e.g. `'ERROR_PUBLISHABLE_KEY'`) */
  public abstract readonly status: string;
  public abstract readonly name: string;

  constructor(message: string) {
    super(message);
  }
}

/** thrown when a publishable key is missing or invalid (e.g. secret key used) */
export class RadarPublishableKeyError extends RadarError {
  public override readonly name = 'RadarPublishableKeyError';
  public override readonly status = 'ERROR_PUBLISHABLE_KEY';

  constructor(message: string) {
    super(message);
  }
}

/** thrown when the device location cannot be determined */
export class RadarLocationError extends RadarError {
  public override readonly name = 'RadarLocationError';
  public override readonly status = 'ERROR_LOCATION';

  constructor(message: string) {
    super(message);
  }
}

/** thrown when location permissions are denied by the browser */
export class RadarPermissionsError extends RadarError {
  public override readonly name = 'RadarPermissionsError';
  public override readonly status = 'ERROR_PERMISSIONS';

  constructor(message: string) {
    super(message);
  }
}

/** thrown on HTTP 400 Bad Request responses */
export class RadarBadRequestError extends RadarError {
  public override readonly name = 'RadarBadRequestError';
  public override readonly status = 'ERROR_BAD_REQUEST';
  public readonly code = 400;
  public readonly response?: RadarResponse;

  constructor(response?: RadarResponse) {
    super(response?.meta?.message || 'Bad request.');

    this.response = response;
  }
}

/** thrown on HTTP 401 Unauthorized responses */
export class RadarUnauthorizedError extends RadarError {
  public override readonly name = 'RadarUnauthorizedError';
  public override readonly status = 'ERROR_UNAUTHORIZED';
  public readonly code = 401;
  public readonly response?: RadarResponse;

  constructor(response?: RadarResponse) {
    super(response?.meta?.message || 'Unauthorized.');

    this.response = response;
  }
}

/** thrown on HTTP 402 Payment Required responses */
export class RadarPaymentRequiredError extends RadarError {
  public override readonly name = 'RadarPaymentRequiredError';
  public override readonly status = 'ERROR_PAYMENT_REQUIRED';
  public readonly code = 402;
  public readonly response?: RadarResponse;

  constructor(response?: RadarResponse) {
    super(response?.meta?.message || 'Payment required.');

    this.response = response;
  }
}

/** thrown on HTTP 403 Forbidden responses */
export class RadarForbiddenError extends RadarError {
  public override readonly name = 'RadarForbiddenError';
  public override readonly status = 'ERROR_FORBIDDEN';
  public readonly code = 403;
  public readonly response?: RadarResponse;

  constructor(response?: RadarResponse) {
    super(response?.meta?.message || 'Forbidden.');

    this.response = response;
  }
}

/** thrown on HTTP 404 Not Found responses */
export class RadarNotFoundError extends RadarError {
  public override readonly name = 'RadarNotFoundError';
  public override readonly status = 'ERROR_NOT_FOUND';
  public readonly code = 404;
  public readonly response?: RadarResponse;

  constructor(response?: RadarResponse) {
    super(response?.meta?.message || 'Not found.');

    this.response = response;
  }
}

/** thrown on HTTP 429 Rate Limit responses */
export class RadarRateLimitError extends RadarError {
  public override readonly name = 'RadarRateLimitError';
  public override readonly status = 'ERROR_RATE_LIMIT';
  public readonly code = 429;
  public readonly response?: RadarResponse;
  /** rate limit type from the API response (e.g. `'hourly'`) */
  public readonly type?: string;

  constructor(response?: RadarResponse) {
    super(response?.meta?.message || 'Rate limit exceeded.');

    this.response = response;
    this.type = response?.meta?.type;
  }
}

/** thrown on HTTP 5xx server errors */
export class RadarServerError extends RadarError {
  public override readonly name = 'RadarServerError';
  public override readonly status = 'ERROR_SERVER';
  public readonly response?: RadarResponse;

  constructor(response?: RadarResponse) {
    super(response?.meta?.message || 'Internal server error.');

    this.response = response;
  }
}

/** thrown when a request times out or the network is unavailable */
export class RadarNetworkError extends RadarError {
  public override readonly name = 'RadarNetworkError';
  public override readonly status = 'ERROR_NETWORK';

  constructor() {
    super('Request timed out.');
  }
}

/** thrown for unexpected/unclassified errors */
export class RadarUnknownError extends RadarError {
  public override readonly name = 'RadarUnknownError';
  public override readonly status = 'ERROR_UNKNOWN';
  public readonly response?: RadarResponse;

  constructor(response?: RadarResponse) {
    super(response?.meta?.message || 'Something went wrong.');

    this.response = response;
  }
}
