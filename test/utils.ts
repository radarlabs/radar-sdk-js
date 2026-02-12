import fetchMock from 'jest-fetch-mock';

import type { NavigatorPosition } from '../src/types';

export const nycOffice: NavigatorPosition = {
  latitude: 40.7342422,
  longitude: -73.9910959,
  accuracy: 10,
};

const defaultPermissionFn = () => Promise.resolve({ state: 'prompt' } as PermissionStatus);
(window as any).navigator.permissions = {
  query: defaultPermissionFn,
};

// mock "approved" location permissions, and return the given position when
// geolocation.getCurrentPosition is called
export const enableLocation = (position: NavigatorPosition, callback?: (args: any) => void) => {
  const defaultFn = window.navigator.geolocation.getCurrentPosition;

  window.navigator.permissions.query = () => Promise.resolve({ state: 'granted' } as PermissionStatus);

  // stub out getCurrentPosition
  window.navigator.geolocation.getCurrentPosition = ((
    success: PositionCallback,
    _err: PositionErrorCallback,
    args: PositionOptions,
  ) => {
    try {
      success({
        coords: position as GeolocationCoordinates,
        timestamp: Date.now(),
        toJSON() {
          return this;
        },
      });

      if (typeof callback === 'function') {
        callback(args);
      }
    } catch (err) {
      console.error(err);
    } finally {
      window.navigator.geolocation.getCurrentPosition = defaultFn;
      window.navigator.permissions.query = defaultPermissionFn;
    }
  }) as typeof defaultFn;
};

// mock a single API response — config calls are handled by the default
// handler in globals.ts, so this only needs to cover the test request.
export const mockRequest = (status: number, response: unknown) => {
  fetchMock.mockResponse(async (req) => {
    if (req.url.includes('/v1/config')) {
      return JSON.stringify({});
    }
    return { body: JSON.stringify(response), status: status || 200 };
  });
};

export const getRequest = () => {
  // find the last non-config fetch call
  const calls = fetchMock.mock.calls;
  const lastCall = [...calls].reverse().find(([url]) => !String(url as string).includes('/v1/config'));

  return {
    url: (lastCall?.[0] ?? '') as string,
    method: lastCall?.[1]?.method ?? 'GET',
    body: lastCall?.[1]?.body as string | undefined,
    headers: (lastCall?.[1]?.headers ?? {}) as Record<string, string>,
  };
};

export const mockNetworkError = () => {
  fetchMock.mockRejectOnce(new TypeError('Network error'));
};

/**
 * Appends a `response` property to the given response object if `isDebug` is true.
 */
export const getResponseWithDebug = (isDebug: boolean | undefined, httpResponse: any, baseResponse: any) => {
  const res = { ...httpResponse };
  delete res.meta;
  if (isDebug) {
    res.response = { ...baseResponse };
  }
  return res;
};
