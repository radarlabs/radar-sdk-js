import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

// default handler: respond to /config calls, 500 for anything else
const defaultFetchHandler = async (req: Request) => {
  if (req.url.includes('/v1/config')) {
    return JSON.stringify({});
  }
  return { status: 500, body: JSON.stringify({ meta: { error: 'ERROR_SERVER' } }) };
};

fetchMock.mockResponse(defaultFetchHandler);

// jest.restoreAllMocks() clears jest.fn() implementations, which breaks
// fetchMock. Re-enable it after each test via a global afterEach hook.
// This file must be loaded via setupFilesAfterEnv so afterEach is available.
afterEach(() => {
  fetchMock.enableMocks();
  fetchMock.doMock();
  fetchMock.mockResponse(defaultFetchHandler);
});

// setup window.navigator to be overridden in tests
const nav = {
  language: 'en-es',
  appName: 'RadarSDKTest',
  geolocation: {
    getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
    },
  },
  permissions: {
    query: () => Promise.resolve({ state: 'prompt' } as PermissionStatus),
  },
};

Object.defineProperty(window, 'navigator', {
  value: nav,
  writable: true,
});

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(window, 'RADAR_TEST_ENV', {
  writable: true,
  value: true,
});
