export class RadarError extends Error {
  status: string;

  constructor(message: string) {
    super(message);
    this.status = ''; // to be overridden (support for legacy status)
  }
}

export class RadarPublishableKeyError extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarPublishableKeyError';
    this.status = 'ERROR_PUBLISHABLE_KEY';
  }
}

export class RadarLocationError extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarLocationError';
    this.status = 'ERROR_LOCATION';
  }
}

export class RadarPermissionsError extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarPermissionsError';
    this.status = 'ERROR_PERMISSIONS';
  }
}

export class RadarVerifyAppError extends RadarError {
  constructor() {
    super('Radar Verify app not running.');
    this.name = 'RadarVerifyAppError';
    this.status = 'ERROR_VERIFY_APP';
  }
}

// HTTP Errors
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

export class RadarRateLimitError extends RadarError {
  code: number;
  response?: any;
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

export class RadarServerError extends RadarError {
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Internal server error.');
    this.name = 'RadarServerError';
    this.response = response;
    this.status = 'ERROR_SERVER';
  }
}

export class RadarNetworkError extends RadarError {
  constructor() {
    super('Request timed out.');
    this.name = 'RadarNetworkError';
    this.status = 'ERROR_NETWORK';
  }
}

export class RadarUnknownError extends RadarError {
  response?: any;

  constructor(response?: any) {
    super(response?.meta?.message || 'Something went wrong.');
    this.name = 'RadarUnknownError';
    this.response = response;
    this.status = 'ERROR_UNKNOWN';
  }
}

export class RadarAutocompleteContainerNotFound extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarAutocompleteContainerNotFound';
    this.status = 'CONTAINER_NOT_FOUND';
  }
}
