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
import { openTaggedSession } from '../../../src/autocompleteSession';
import Config from '../../../src/config';
import Device from '../../../src/device';
import Http from '../../../src/http';
import Logger from '../../../src/logger';
import Navigator from '../../../src/navigator';
import Session from '../../../src/session';
import Storage from '../../../src/storage';
import AutocompleteUI from '../src/autocomplete';
import WIDGET_VERSION from '../src/version';

import type { RadarPluginContext } from '../../../src/plugin';
import type { RadarAutocompleteUIOptions } from '../src/types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const REQUEST_ID = '01a01c2e-7512-704c-aa02-81253218d810';

const INTEGRATION = `autocomplete-ui@${WIDGET_VERSION}`;

const addresses = [
  { formattedAddress: '66 Steuben St, Brooklyn, NY 11205 USA', addressLabel: '66 Steuben St' },
  { formattedAddress: '67 Steuben St, Brooklyn, NY 11205 USA', addressLabel: '67 Steuben St' },
];

// the real SDK modules, assembled the same way Radar.registerPlugin does.
const ctx = {
  Radar: Radar as RadarPluginContext['Radar'],
  createAutocompleteSession: openTaggedSession,
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
} satisfies RadarPluginContext;

// respond to autocomplete calls with a request id header, and to select calls with a bare 204
/** the server stamps one handle per result; the suffix identifies which response it came from */
const addressesFrom = (response: string) =>
  addresses.map((address, idx) => ({ ...address, resultId: `v1_${response}-${idx}` }));

const mockAutocompleteApi = (response = 'first', requestId = REQUEST_ID) => {
  fetchMock.mockResponse(async (req) => {
    if (req.url.includes('/v1/config')) {
      return JSON.stringify({});
    }
    if (req.url.includes('/search/autocomplete/select')) {
      return { body: '', status: 204 };
    }
    return {
      body: JSON.stringify({ meta: {}, addresses: addressesFrom(response) }),
      status: 200,
      headers: { 'x-radar-request-id': requestId },
    };
  });
};

const autocompleteRequests = () =>
  fetchMock.mock.calls.filter(([url]) => String(url as string).includes('/search/autocomplete?'));

const selectRequests = () =>
  fetchMock.mock.calls.filter(([url]) => String(url as string).includes('/search/autocomplete/select'));

// `ctx as never` is the one unchecked point: AutocompleteUI's declared parameter resolves to
// the dist-built RadarPluginContext, and classes with private members are nominally typed, so
// the src-built ctx above is not assignable to it. every value in it is the real module.
const mount = (options: Partial<RadarAutocompleteUIOptions> = {}) =>
  new AutocompleteUI({ container: 'autocomplete', ...options }, ctx as never);

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
    const widget = mount();

    await widget.fetchResults('66 steuben');

    const url = new URL(String(autocompleteRequests()[0]![0] as string));
    expect(url.searchParams.get('sessionToken')).toMatch(UUID_PATTERN);
  });

  it('reuses the same session token across requests', async () => {
    const widget = mount();

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

    const first = mount();
    const second = mount({ container: 'autocomplete-2' });

    expect(first.sessionToken).not.toEqual(second.sessionToken);
  });

  it('reports a selection with the handle carried by the chosen result, and nothing else', async () => {
    const widget = mount();

    const results = await widget.fetchResults('66 steuben');
    widget.displayResults(results);
    widget.select(1);
    await Promise.resolve();

    const select = selectRequests()[0];
    expect(select).toBeDefined();
    expect(JSON.parse(select![1]!.body as string)).toEqual({
      resultId: 'v1_first-1',
      integration: INTEGRATION,
    });
  });

  it('tags autocomplete requests as widget-originated', async () => {
    const widget = mount();

    await widget.fetchResults('66 steuben');

    const url = new URL(String(autocompleteRequests()[0]![0] as string));
    expect(url.searchParams.get('integration')).toEqual(INTEGRATION);
  });

  it('tags selections as widget-originated, so both legs of a session are attributable', async () => {
    const widget = mount();

    widget.displayResults(await widget.fetchResults('66 steuben'));
    widget.select(0);
    await Promise.resolve();

    expect(JSON.parse(selectRequests()[0]![1]!.body as string).integration).toEqual(INTEGRATION);
  });

  it('reports the selection against the most recent autocomplete response', async () => {
    const widget = mount();

    mockAutocompleteApi('stale');
    widget.displayResults(await widget.fetchResults('66 steu'));

    mockAutocompleteApi('current');
    widget.displayResults(await widget.fetchResults('66 steuben'));

    widget.select(0);
    await Promise.resolve();

    const select = selectRequests()[0];
    expect(JSON.parse(select![1]!.body as string)).toEqual({
      resultId: 'v1_current-0',
      integration: INTEGRATION,
    });
  });

  it('reports the selection even when onSelection throws', async () => {
    const widget = mount({
      onSelection: () => {
        throw new Error('consumer callback blew up');
      },
    });

    widget.displayResults(await widget.fetchResults('66 steuben'));
    expect(() => widget.select(0)).toThrow('consumer callback blew up');
    await Promise.resolve();

    expect(selectRequests()).toHaveLength(1);
  });

  it('does not report a selection when the results carry no handle', async () => {
    fetchMock.mockResponse(async (req) => {
      if (req.url.includes('/v1/config')) {
        return JSON.stringify({});
      }
      if (req.url.includes('/search/autocomplete/select')) {
        return { body: '', status: 204 };
      }
      // no resultId on the results: the server opened no selectable session
      return { body: JSON.stringify({ meta: {}, addresses }), status: 200 };
    });
    const widget = mount();

    widget.displayResults(await widget.fetchResults('66 steuben'));
    widget.select(0);
    await Promise.resolve();

    expect(selectRequests()).toHaveLength(0);
  });

  it("scopes each widget's requests to its own session token", async () => {
    document.body.innerHTML = '<div id="autocomplete"></div><div id="autocomplete-2"></div>';
    const first = mount();
    const second = mount({ container: 'autocomplete-2' });

    // serialized on purpose: both widgets share the 'autocomplete-ui' dedup key, so concurrent
    // fetches abort each other. that behavior predates session association and is deliberately left
    // alone, so this asserts only that session tokens do not leak between widgets.
    await first.fetchResults('66 steu');
    await second.fetchResults('120 fifth');

    const tokens = autocompleteRequests().map(([url]) =>
      new URL(String(url as string)).searchParams.get('sessionToken'),
    );
    expect(tokens).toEqual([first.sessionToken, second.sessionToken]);
    expect(first.sessionToken).not.toEqual(second.sessionToken);
  });

  it('does not report a selection when the selected index has no result', async () => {
    const widget = mount();

    widget.displayResults(await widget.fetchResults('66 steuben'));
    widget.select(99);
    await Promise.resolve();

    expect(selectRequests()).toHaveLength(0);
  });
});
