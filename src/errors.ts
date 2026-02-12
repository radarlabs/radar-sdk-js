/** base error class for all Radar SDK errors */
export class RadarError extends Error {
  /** legacy status code string (e.g. `'ERROR_PUBLISHABLE_KEY'`) */
  status: string;

  constructor(message: string) {
    super(message);
    this.status = ''; // to be overridden (support for legacy status)
  }
}

/** thrown when a publishable key is missing or invalid (e.g. secret key used) */
export class RadarPublishableKeyError extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarPublishableKeyError';
    this.status = 'ERROR_PUBLISHABLE_KEY';
  }
}

/** thrown when the device location cannot be determined */
export class RadarLocationError extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarLocationError';
    this.status = 'ERROR_LOCATION';
  }
}

/** thrown when location permissions are denied by the browser */
export class RadarPermissionsError extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarPermissionsError';
    this.status = 'ERROR_PERMISSIONS';
  }
}

/** thrown on HTTP 400 Bad Request responses */
export class RadarBadRequestError extends RadarError {
  code: number;
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Bad request.');
    this.name = 'RadarBadRequestError';
    this.code = 400;
    this.response = response;
    this.status = 'ERROR_BAD_REQUEST';
  }
}

/** thrown on HTTP 401 Unauthorized responses */
export class RadarUnauthorizedError extends RadarError {
  code: number;
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Unauthorized.');
    this.name = 'RadarUnauthorizedError';
    this.code = 401;
    this.response = response;
    this.status = 'ERROR_UNAUTHORIZED';
  }
}

/** thrown on HTTP 402 Payment Required responses */
export class RadarPaymentRequiredError extends RadarError {
  code: number;
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Payment required.');
    this.name = 'RadarPaymentRequiredError';
    this.code = 402;
    this.response = response;
    this.status = 'ERROR_PAYMENT_REQUIRED';
  }
}

/** thrown on HTTP 403 Forbidden responses */
export class RadarForbiddenError extends RadarError {
  code: number;
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Forbidden.');
    this.name = 'RadarForbiddenError';
    this.code = 403;
    this.response = response;
    this.status = 'ERROR_FORBIDDEN';
  }
}

/** thrown on HTTP 404 Not Found responses */
export class RadarNotFoundError extends RadarError {
  code: number;
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Not found.');
    this.name = 'RadarNotFoundError';
    this.code = 404;
    this.response = response;
    this.status = 'ERROR_NOT_FOUND';
  }
}

/** thrown on HTTP 429 Rate Limit responses */
export class RadarRateLimitError extends RadarError {
  code: number;
  response?: any;
  /** rate limit type from the API response (e.g. `'hourly'`) */
  type: string;

  constructor(response?: any) {
    super(response?.meta?.message || 'Rate limit exceeded.');
    this.name = 'RadarRateLimitError';
    this.code = 429;
    this.response = response;
    this.type = response?.meta?.type;
    this.status = 'ERROR_RATE_LIMIT';
  }
}

/** thrown on HTTP 5xx server errors */
export class RadarServerError extends RadarError {
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Internal server error.');
    this.name = 'RadarServerError';
    this.response = response;
    this.status = 'ERROR_SERVER';
  }
}

/** thrown when a request times out or the network is unavailable */
export class RadarNetworkError extends RadarError {
  constructor() {
    super('Request timed out.');
    this.name = 'RadarNetworkError';
    this.status = 'ERROR_NETWORK';
  }
}

/** thrown for unexpected/unclassified errors */
export class RadarUnknownError extends RadarError {
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Something went wrong.');
    this.name = 'RadarUnknownError';
    this.response = response;
    this.status = 'ERROR_UNKNOWN';
  }
}
