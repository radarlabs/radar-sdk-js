import { NavigatorPosition } from '../src/types';

import type MockXhrRequest from 'mock-xmlhttprequest/dist/types/MockXhrRequest';

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
export const enableLocation = (position: NavigatorPosition, callback?: any) => {
  const defaultFn = window.navigator.geolocation.getCurrentPosition;

  window.navigator.permissions.query = () => Promise.resolve({ state: 'granted' } as PermissionStatus);

  // stub out getCurrentPosition
  window.navigator.geolocation.getCurrentPosition = ((success, err, args) => {
    try {
      success({
        coords: position as GeolocationCoordinates,
        timestamp: Date.now(),
      });

      // callback used for testing passed arguments
      if (typeof callback === 'function') {
        callback(args);
      }

    } catch (err) {
      console.error(err);

    } finally {
      // restore previous function
      window.navigator.geolocation.getCurrentPosition = defaultFn;
      window.navigator.permissions.query = defaultPermissionFn;
    }
  });
}

// this is initialized as MockXhr in ./mock-data/globals
const MockXhr = window.XMLHttpRequest as any;

// mock out a single request
const responseHeaders = { 'Content-Type': 'application/json' };
export const mockRequest = (status: number, response: any) => {
  const prevHandler = MockXhr.onSend;

  MockXhr.onSend = (request: MockXhrRequest) => {
    // default handler for config calls
    if (request.url.includes('/v1/config')) {
      request.respond(200, responseHeaders, JSON.stringify({}));
      return;
    }

    // respond with given response
    request.respond(status || 200, responseHeaders, JSON.stringify(response));

    // reset default XHR
    MockXhr.onSend = prevHandler;
  };
}
