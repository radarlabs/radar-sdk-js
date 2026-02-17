import Config from './config';
import {
  RadarBadRequestError,
  RadarForbiddenError,
  RadarLocationError,
  RadarNetworkError,
  RadarNotFoundError,
  RadarPaymentRequiredError,
  RadarPermissionsError,
  RadarPublishableKeyError,
  RadarRateLimitError,
  RadarServerError,
  RadarUnauthorizedError,
  RadarUnknownError,
} from './errors';
import Logger from './logger';
import Navigator from './navigator';
import SDK_VERSION from './version';

/** HTTP methods supported by the SDK */
type HttpMethod = 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE';

/** Shape of the `meta` field present in all Radar API responses */
interface RadarApiMeta {
  error?: string;
  message?: string;
  type?: string;
}

/** Base shape all Radar API JSON responses share */
interface RadarApiResponse {
  meta?: RadarApiMeta;
  [key: string]: unknown;
}

/** Blob response shape returned when responseType is 'blob' */
interface RadarBlobResponse {
  meta?: undefined;
  code: number;
  data: Blob;
}

export type RadarResponse = RadarApiResponse | RadarBlobResponse;

/** Request configuration for Http.request */
interface HttpRequestOptions {
  method: HttpMethod;
  path: string;
  data?: Record<string, any>;
  host?: string;
  version?: string;
  headers?: Record<string, string>;
  responseType?: 'blob' | 'json';
  requestId?: string;
}

const inFlightRequests = new Map<string, AbortController>();

/** fetch-based HTTP client for Radar API requests */
class Http {
  /** map of host patterns to custom error factories for intercepting network errors */
  static errorInterceptors: Map<string, (online: boolean) => Error> = new Map();

  /**
   * register a custom error factory for network errors matching a host pattern
   * @param hostPattern - substring matched against the request host
   * @param handler - factory that receives online status and returns an error
   */
  static registerErrorInterceptor(hostPattern: string, handler: (online: boolean) => Error) {
    Http.errorInterceptors.set(hostPattern, handler);
  }

  /**
   * send an HTTP request to the Radar API
   * @param options - request configuration
   * @returns parsed response body, typed as `T`
   * @throws {RadarPublishableKeyError} if publishable key is not set
   * @throws {RadarBadRequestError} on 400 responses
   * @throws {RadarUnauthorizedError} on 401 responses
   * @throws {RadarNetworkError} on network failures
   */
  static async request(options: HttpRequestOptions & { responseType: 'blob' }): Promise<RadarBlobResponse>;
  static async request<T extends Record<string, any> = RadarApiResponse>(
    options: HttpRequestOptions,
  ): Promise<T & { meta?: RadarApiMeta }>;
  static async request<T extends Record<string, any> = RadarApiResponse>({
    method,
    path,
    data,
    host,
    version,
    headers = {},
    responseType,
    requestId,
  }: HttpRequestOptions): Promise<(T & { meta?: RadarApiMeta }) | RadarBlobResponse> {
    const options = Config.get();

    const publishableKey = options.publishableKey;
    if (!publishableKey) {
      throw new RadarPublishableKeyError('publishableKey not set.');
    }

    const urlHost = host || options.host;
    const urlVersion = version || options.version;
    let url = `${urlHost}/${urlVersion}/${path}`;

    // filter out undefined values from request data
    const filtered = Object.fromEntries(Object.entries(data ?? {}).filter(([, v]) => v !== undefined));

    let body: string | undefined;

    if (method === 'GET') {
      const params = new URLSearchParams(Object.entries(filtered).map(([k, v]) => [k, String(v)]));
      const qs = params.toString();
      if (qs) {
        url = `${url}?${qs}`;
      }
    } else {
      body = JSON.stringify(filtered);
    }

    // abort in-flight requests with matching requestIds
    if (requestId) {
      inFlightRequests.get(requestId)?.abort();
    }

    const abortController = new AbortController();

    if (requestId) {
      inFlightRequests.set(requestId, abortController);
    }

    const defaultHeaders: Record<string, string> = {
      Authorization: publishableKey,
      'Content-Type': 'application/json',
      'X-Radar-Device-Type': 'Web',
      'X-Radar-SDK-Version': SDK_VERSION,
    };

    let configHeaders: Record<string, string> = {};
    if (typeof options.getRequestHeaders === 'function') {
      configHeaders = options.getRequestHeaders();
    }

    const allHeaders: Record<string, string> = { ...defaultHeaders, ...configHeaders, ...headers };

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: allHeaders,
        body,
        signal: abortController.signal,
      });
    } catch {
      // Delete abort controller instance for this request ID if it hasn't yet been replaced with a different one
      if (requestId && inFlightRequests.get(requestId) === abortController) {
        inFlightRequests.delete(requestId);
      }

      if (host) {
        for (const [pattern, handler] of Http.errorInterceptors) {
          if (host.includes(pattern)) {
            throw handler(!!Navigator.online());
          }
        }
      }
      throw new RadarNetworkError();
    }

    if (requestId && inFlightRequests.get(requestId) === abortController) {
      inFlightRequests.delete(requestId);
    }

    let parsed: RadarResponse | undefined;
    try {
      if (responseType === 'blob') {
        parsed = { code: response.status, data: await response.blob() };
      } else {
        parsed = (await response.json()) as RadarApiResponse;
      }
    } catch (err) {
      if (parsed) {
        throw new RadarServerError(parsed);
      } else {
        if (options.debug) {
          Logger.debug(`API call failed: ${url}`);
          Logger.debug(String(err));
        }

        throw new RadarUnknownError(parsed);
      }
    }

    if (parsed && typeof parsed === 'object' && 'meta' in parsed) {
      const error = parsed.meta?.error;
      if (error === 'ERROR_PERMISSIONS') {
        throw new RadarPermissionsError('Location permissions not granted.');
      } else if (error === 'ERROR_LOCATION') {
        throw new RadarLocationError('Could not determine location.');
      } else if (error === 'ERROR_NETWORK') {
        throw new RadarNetworkError();
      }
    }

    if (response.ok) {
      return parsed as T;
    }

    if (options.debug) {
      Logger.debug(`API call failed: ${url}`);
      Logger.debug(JSON.stringify(parsed));
    }

    if (response.status === 400) {
      throw new RadarBadRequestError(parsed);
    } else if (response.status === 401) {
      throw new RadarUnauthorizedError(parsed);
    } else if (response.status === 402) {
      throw new RadarPaymentRequiredError(parsed);
    } else if (response.status === 403) {
      throw new RadarForbiddenError(parsed);
    } else if (response.status === 404) {
      throw new RadarNotFoundError(parsed);
    } else if (response.status === 429) {
      throw new RadarRateLimitError(parsed);
    } else if (response.status >= 500 && response.status < 600) {
      throw new RadarServerError(parsed);
    } else {
      throw new RadarUnknownError(parsed);
    }
  }
}

export default Http;
