import fetchMock from 'jest-fetch-mock';

import Radar from '../../../src';
import AddressesAPI from '../../../src/api/addresses';
import ConfigAPI from '../../../src/api/config';
import ContextAPI from '../../../src/api/context';
import ConversionsAPI from '../../../src/api/conversions';
import GeocodingAPI from '../../../src/api/geocoding';
import RoutingAPI from '../../../src/api/routing';
import SearchAPI from '../../../src/api/search';
import TrackAPI from '../../../src/api/track';
import TripsAPI from '../../../src/api/trips';
import Config from '../../../src/config';
import Device from '../../../src/device';
import Http from '../../../src/http';
import Logger from '../../../src/logger';
import Navigator from '../../../src/navigator';
import Session from '../../../src/session';
import Storage from '../../../src/storage';
import AutocompleteUI from '../src/autocomplete';

import type { RadarPluginContext } from 'radar-sdk-js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const REQUEST_ID = '01a01c2e-7512-704c-aa02-81253218d810';

const addresses = [
  { formattedAddress: '66 Steuben St, Brooklyn, NY 11205 USA', addressLabel: '66 Steuben St' },
  { formattedAddress: '67 Steuben St, Brooklyn, NY 11205 USA', addressLabel: '67 Steuben St' },
];

// the real SDK modules, assembled the same way Radar.registerPlugin does. the cast bridges
// the src-vs-dist declarations of RadarPluginContext; every value here is the real module.
const ctx = {
  Radar,
  Config,
  Http,
  Storage,
  Device,
  Session,
  Logger,
  Navigator,
  apis: {
    Addresses: AddressesAPI,
    Config: ConfigAPI,
    Context: ContextAPI,
    Conversions: ConversionsAPI,
    Geocoding: GeocodingAPI,
    Routing: RoutingAPI,
    Search: SearchAPI,
    Track: TrackAPI,
    Trips: TripsAPI,
  },
} as unknown as RadarPluginContext;

// respond to autocomplete calls with a request id header, and to click calls with a bare 204
const mockAutocompleteApi = (requestId = REQUEST_ID) => {
  fetchMock.mockResponse(async (req) => {
    if (req.url.includes('/v1/config')) {
      return JSON.stringify({});
    }
    if (req.url.includes('/search/autocomplete/click')) {
      return { body: '', status: 204 };
    }
    return {
      body: JSON.stringify({ meta: {}, addresses }),
      status: 200,
      headers: { 'x-radar-request-id': requestId },
    };
  });
};

const autocompleteRequests = () =>
  fetchMock.mock.calls.filter(([url]) => String(url as string).includes('/search/autocomplete?'));

const clickRequests = () =>
  fetchMock.mock.calls.filter(([url]) => String(url as string).includes('/search/autocomplete/click'));

const createWidget = () => new AutocompleteUI({ container: 'autocomplete' }, ctx);

describe('AutocompleteUI sessions', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="autocomplete"></div>';
    Radar.initialize('prj_test_pk_123');
    mockAutocompleteApi();
  });

  afterEach(() => {
    Radar.clear();
    jest.restoreAllMocks();
  });

  it('sends a session token UUID on every autocomplete request', async () => {
    const widget = createWidget();

    await widget.fetchResults('66 steuben');

    const url = new URL(String(autocompleteRequests()[0]![0] as string));
    expect(url.searchParams.get('sessionToken')).toMatch(UUID_PATTERN);
  });

  it('reuses the same session token across requests', async () => {
    const widget = createWidget();

    await widget.fetchResults('66 steu');
    await widget.fetchResults('66 steuben');

    const tokens = autocompleteRequests().map(([url]) =>
      new URL(String(url as string)).searchParams.get('sessionToken'),
    );
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual(tokens[1]);
  });

  it('mints a distinct session token per widget', () => {
    document.body.innerHTML = '<div id="autocomplete"></div><div id="autocomplete-2"></div>';

    const first = new AutocompleteUI({ container: 'autocomplete' }, ctx);
    const second = new AutocompleteUI({ container: 'autocomplete-2' }, ctx);

    expect(first.sessionToken).not.toEqual(second.sessionToken);
  });

  it('reports a click with the session token, originating request id, and result index', async () => {
    const widget = createWidget();

    const results = await widget.fetchResults('66 steuben');
    widget.displayResults(results);
    widget.select(1);
    await Promise.resolve();

    const click = clickRequests()[0];
    expect(click).toBeDefined();
    expect(JSON.parse(click![1]!.body as string)).toEqual({
      sessionToken: widget.sessionToken,
      requestId: REQUEST_ID,
      idx: 1,
    });
  });

  it('reports the click against the most recent autocomplete response', async () => {
    const widget = createWidget();

    mockAutocompleteApi('01a01c2e-7512-704c-aa02-000000000001');
    widget.displayResults(await widget.fetchResults('66 steu'));

    mockAutocompleteApi('01a01c2e-7512-704c-aa02-000000000002');
    widget.displayResults(await widget.fetchResults('66 steuben'));

    widget.select(0);
    await Promise.resolve();

    const click = clickRequests()[0];
    expect(JSON.parse(click![1]!.body as string).requestId).toEqual('01a01c2e-7512-704c-aa02-000000000002');
  });

  it('does not report a click when the selected index has no result', async () => {
    const widget = createWidget();

    widget.displayResults(await widget.fetchResults('66 steuben'));
    widget.select(99);
    await Promise.resolve();

    expect(clickRequests()).toHaveLength(0);
  });
});
