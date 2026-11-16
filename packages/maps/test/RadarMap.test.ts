import Radar from '../../../src';
import Config from '../../../src/config';
import Logger from '../../../src/logger';
import RadarMap from '../src/RadarMap';

import type { MapOptions, RequestParameters, ResourceType as MaplibreResourceType } from 'maplibre-gl';

// MapLibre's ResourceType is a type-only const enum; its string values are what reach transformRequest
type ResourceType = `${MaplibreResourceType}`;

// jsdom has no WebGL, so stand in for MapLibre's Map and keep the options RadarMap passes it.
// `virtual` because maplibre-gl only exports an ESM `import` entry, which jest can't resolve.
// jest only lets the mock factory reach outer variables whose names start with `mock`.
let mockMapOptions: MapOptions | undefined;
jest.mock(
  'maplibre-gl',
  () => ({
    Map: class {
      constructor(options: MapOptions) {
        mockMapOptions = options;
      }
      getContainer() {
        return document.createElement('div');
      }
      addControl() {}
      on() {}
    },
    AttributionControl: class {},
    NavigationControl: class {},
    LngLatBounds: class {},
  }),
  { virtual: true },
);

const PUBLISHABLE_KEY = 'prj_test_pk_123';
const AUTH_TOKEN = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123';

const RADAR = 'https://api.radar.io';
const STYLE_URL = `${RADAR}/maps/styles/radar-default-v1`;
const OTHER_STYLE_URL = 'https://tiles.example.com/style.json';

// everything a Radar style loads after the style itself, keyed by the request's resource type
const RADAR_SUBRESOURCES: [ResourceType, string][] = [
  ['Source', `${RADAR}/maps/data/v1.json?publishableKey=${PUBLISHABLE_KEY}`],
  ['Tile', `${RADAR}/maps/tiles/v1/1/2/3.pbf?publishableKey=${PUBLISHABLE_KEY}`],
  ['Glyphs', `${RADAR}/maps/static/fonts/Noto%20Sans/0-255.pbf?publishableKey=${PUBLISHABLE_KEY}`],
  ['SpriteJSON', `${RADAR}/maps/static/sprites/sprite.json`],
  ['SpriteImage', `${RADAR}/maps/static/sprites/sprite.png`],
];

const OTHER_HOST_REQUESTS: [ResourceType, string][] = [
  ['Style', OTHER_STYLE_URL],
  ['Tile', 'https://tiles.example.com/1/2/3.pbf'],
  ['Glyphs', 'https://fonts.example.com/Noto%20Sans/0-255.pbf'],
  // same hostname, different scheme
  ['Tile', 'http://api.radar.io/maps/tiles/v1/1/2/3.pbf'],
];

// RadarMap only reads Config and Logger from the plugin context. `as never` because the
// declared parameter is the dist-built RadarPluginContext (see autocomplete.test.ts).
const ctx = { Config, Logger };

// run a request through the transformRequest that RadarMap hands to MapLibre
const transform = (resourceType: ResourceType, url: string, style = STYLE_URL) => {
  new RadarMap({ container: document.createElement('div'), style }, ctx as never);
  return mockMapOptions!.transformRequest!(url, resourceType as MaplibreResourceType) as RequestParameters;
};

describe('RadarMap transformRequest', () => {
  afterEach(() => {
    Radar.clear();
  });

  describe('with a publishable key', () => {
    beforeEach(() => {
      Radar.initialize(PUBLISHABLE_KEY, { getRequestHeaders: () => ({ 'X-Custom': 'val' }) });
    });

    it('sends Radar headers on the Radar style request', () => {
      expect(transform('Style', STYLE_URL)).toEqual({
        url: STYLE_URL,
        headers: Config.getDefaultHeaders(),
      });
      expect(transform('Style', STYLE_URL).headers).toMatchObject({
        Authorization: PUBLISHABLE_KEY,
        'X-Custom': 'val',
      });
    });

    it('sends Radar headers when switching to a Radar style by name', () => {
      expect(transform('Style', 'radar-dark-v1')).toEqual({
        url: `${RADAR}/maps/styles/radar-dark-v1`,
        headers: Config.getDefaultHeaders(),
      });
    });

    it.each(RADAR_SUBRESOURCES)('sends no headers on a Radar %s request', (resourceType, url) => {
      expect(transform(resourceType, url)).toEqual({ url });
    });

    it.each(OTHER_HOST_REQUESTS)('sends no headers on a %s request to %s', (resourceType, url) => {
      expect(transform(resourceType, url, OTHER_STYLE_URL)).toEqual({ url });
    });
  });

  describe('with an authToken', () => {
    beforeEach(() => {
      Radar.initialize({ authToken: AUTH_TOKEN });
    });

    it.each([['Style', STYLE_URL] as [ResourceType, string], ...RADAR_SUBRESOURCES])(
      'sends Radar headers on a Radar %s request',
      (resourceType, url) => {
        const request = transform(resourceType, url);
        expect(request).toEqual({ url, headers: Config.getDefaultHeaders() });
        expect(request.headers).toMatchObject({ Authorization: `Bearer ${AUTH_TOKEN}` });
      },
    );

    it.each(OTHER_HOST_REQUESTS)('sends no headers on a %s request to %s', (resourceType, url) => {
      expect(transform(resourceType, url, OTHER_STYLE_URL)).toEqual({ url });
    });
  });

  describe('with a custom host', () => {
    const HOST = 'https://api-staging.radar.io';

    beforeEach(() => {
      Radar.initialize(PUBLISHABLE_KEY, { host: HOST });
    });

    it('sends Radar headers on a style request to the configured host', () => {
      const request = transform('Style', 'radar-default-v1');
      expect(request).toEqual({ url: `${HOST}/maps/styles/radar-default-v1`, headers: Config.getDefaultHeaders() });
    });

    it('treats the default Radar host as a different host', () => {
      expect(transform('Style', STYLE_URL)).toEqual({ url: STYLE_URL });
    });
  });
});
