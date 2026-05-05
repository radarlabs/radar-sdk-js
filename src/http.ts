import Config from './config';
import { scheduleDnsOverHttpsProbe, type DnsProbeResult } from './dns-over-https';
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

import type { RadarNetworkFailureDetails } from './errors';

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

interface NavigatorNW extends Navigator {
  /** Network Information API; see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation */
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
}

type ConnectionExtras = Partial<
  Pick<
    RadarNetworkFailureDetails,
    'connectionEffectiveType' | 'connectionDownlink' | 'connectionRtt' | 'connectionSaveData'
  >
>;

/** gather optional Network Information API snapshot (best-effort) */
function getConnectionSnapshot(nav: Navigator | undefined): ConnectionExtras {
  if (!nav) {
    return {};
  }
  const c = (nav as NavigatorNW).connection;
  if (!c) {
    return {};
  }
  return {
    ...(c.effectiveType !== undefined ? { connectionEffectiveType: String(c.effectiveType) } : {}),
    ...(typeof c.downlink === 'number' ? { connectionDownlink: c.downlink } : {}),
    ...(typeof c.rtt === 'number' ? { connectionRtt: c.rtt } : {}),
    ...(typeof c.saveData === 'boolean' ? { connectionSaveData: c.saveData } : {}),
  };
}

function isAbortError(err: unknown, signal: AbortSignal): boolean {
  if (signal.aborted) {
    return true;
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return true;
  }
  return err instanceof Error && err.name === 'AbortError';
}

function parseThrowable(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  if (typeof err === 'string') {
    return { name: 'string', message: err };
  }
  return { name: 'non_error', message: String(err) };
}

/** monotonic-ish timestamp in ms (`performance.now` when available; else `Date.now`) */
function getHighResTime(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

function buildFetchFailureDetails(
  method: HttpMethod,
  url: string,
  requestId: string | undefined,
  err: unknown,
  signal: AbortSignal,
  /** elapsed ms from immediately before `fetch()` until rejection */
  durationMs: number,
): RadarNetworkFailureDetails {
  let pathname = '';
  let search = '';
  let apiHostname: string | undefined;

  try {
    const parsed = new URL(url);
    pathname = parsed.pathname;
    search = parsed.search;
    apiHostname = parsed.hostname;
  } catch {
    pathname = url;
  }

  const { name, message, stack } = parseThrowable(err);
  const aborted = isAbortError(err, signal);
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  let pageOrigin: string | undefined;
  let pagePath: string | undefined;
  let userAgent: string | undefined;
  let crossSiteApiCall: boolean | undefined;

  if (typeof window !== 'undefined' && window.location && nav) {
    pageOrigin = window.location.origin;
    pagePath = window.location.pathname === '' ? '/' : window.location.pathname;
    userAgent = nav.userAgent;
    if (apiHostname !== undefined && window.location.hostname !== '') {
      crossSiteApiCall = window.location.hostname !== apiHostname;
    }
  }

  const online = Boolean(nav && nav.onLine);

  return {
    phase: 'fetch',
    method,
    url,
    pathname,
    search,
    durationMs: Math.max(0, Math.round(durationMs)),
    ...(apiHostname !== undefined ? { apiHostname } : {}),
    ...(pageOrigin !== undefined ? { pageOrigin } : {}),
    ...(pagePath !== undefined ? { pagePath } : {}),
    ...(userAgent !== undefined ? { userAgent } : {}),
    ...(crossSiteApiCall !== undefined ? { crossSiteApiCall } : {}),
    online,
    aborted,
    errorName: name,
    errorMessage: message,
    ...(stack ? { errorStack: stack } : {}),
    ...getConnectionSnapshot(nav),
    ...(requestId ? { requestId } : {}),
  };
}

function fetchFailureUserMessage(details: RadarNetworkFailureDetails): string {
  if (details.aborted) {
    return 'Request aborted.';
  }
  if (details.errorMessage) {
    return details.errorMessage;
  }
  if (!details.online) {
    return 'Network unavailable (browser offline).';
  }
  return 'Network request failed.';
}

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
   * @throws {RadarPublishableKeyError} if neither publishable key nor authToken is set
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

    const { publishableKey, authToken } = options;
    if (!publishableKey && !authToken) {
      throw new RadarPublishableKeyError('publishableKey or authToken not set.');
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

    const allHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Config.getDefaultHeaders(),
      ...headers,
    };

    let response: Response;
    const fetchStartedAt = getHighResTime();
    try {
      response = await fetch(url, {
        method,
        headers: allHeaders,
        body,
        signal: abortController.signal,
      });
    } catch (fetchErr) {
      let dnsProbePromise: Promise<DnsProbeResult> | null = null;
      const durationMs = getHighResTime() - fetchStartedAt;
      // Delete abort controller instance for this request ID if it hasn't yet been replaced with a different one
      if (requestId && inFlightRequests.get(requestId) === abortController) {
        inFlightRequests.delete(requestId);
      }

      const fetchFailureDetails = buildFetchFailureDetails(
        method,
        url,
        requestId,
        fetchErr,
        abortController.signal,
        durationMs,
      );

      Logger.error(
        `Fetch failed (${fetchFailureDetails.aborted ? 'aborted' : fetchFailureDetails.errorName})`,
        fetchFailureDetails,
      );

      if (!fetchFailureDetails.aborted) {
        dnsProbePromise = scheduleDnsOverHttpsProbe(fetchFailureDetails.apiHostname, {
          requestFailure: {
            method: fetchFailureDetails.method,
            url: fetchFailureDetails.url,
            durationMs: fetchFailureDetails.durationMs,
            phase: fetchFailureDetails.phase,
            errorName: fetchFailureDetails.errorName,
            errorMessage: fetchFailureDetails.errorMessage,
            crossSiteApiCall: fetchFailureDetails.crossSiteApiCall,
          },
        });
      }

      for (const [pattern, interceptorHandler] of Http.errorInterceptors) {
        if ((urlHost ?? '').includes(pattern)) {
          throw interceptorHandler(!!Navigator.online());
        }
      }

      const userMsg = fetchFailureUserMessage(fetchFailureDetails);
      throw new RadarNetworkError(userMsg, fetchFailureDetails, fetchErr, dnsProbePromise);
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
        Logger.error('Radar API returned ERROR_NETWORK in response meta', {
          httpStatus: response.status,
          method,
          url,
          meta: parsed.meta ?? null,
        });
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
