const { newMockXhr } = require('mock-xmlhttprequest');

// setup window.navigator to be overridden in tests
const navigator = {
  language: 'en-es',
  appName: 'RadarSDKTest',
  geolocation: {
    getCurrentPosition: (_ /* success */, error) => {
      error({ code: 1, message: 'User denied Geolocation' }); // default to permission denied
    },
  },
};

Object.defineProperty(window, 'navigator', {
  value: navigator,
  writable: true
});

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn()
});

// mock HTTP server
const MockXhr = newMockXhr();
window.XMLHttpRequest = MockXhr;

// default handler for /config calls
const responseHeaders = { 'Content-Type': 'application/json' };
const defaultHandler = (request) => {
  if (request.url.includes('/v1/config')) {
    request.respond(200, responseHeaders, JSON.stringify({}));
  }
};
MockXhr.onSend = defaultHandler;
