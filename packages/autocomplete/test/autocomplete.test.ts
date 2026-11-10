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
import type { RadarAutocompleteEnrichedAddress } from '../../../src/types';
import type { RadarAutocompleteUIOptions } from '../src/types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const INTEGRATION = `autocomplete@${WIDGET_VERSION}`;

const addresses = [
  { formattedAddress: '111 5th Ave, New York, NY 10003 USA', addressLabel: '111 5th Ave' },
  { formattedAddress: '113 5th Ave, New York, NY 10003 USA', addressLabel: '113 5th Ave' },
];

// the real SDK modules, assembled the same way Radar.registerPlugin does.
const ctx = {
  Radar: Radar as RadarPluginContext['Radar'],
  integration: { name: 'autocomplete', version: WIDGET_VERSION },
  createAutocompleteSession: () => openTaggedSession({ name: 'autocomplete', version: WIDGET_VERSION }),
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

/** the server stamps one handle per result; the suffix identifies which response it came from */
const addressesFrom = (response: string) =>
  addresses.map((address, idx) => ({ ...address, resultId: `v1_${response}-${idx}` }));

/** what /select returns for a project with address enrichment enabled */
const ENRICHED: RadarAutocompleteEnrichedAddress = {
  formattedAddress: addresses[0]!.formattedAddress,
  locationDetails: { usage: 'nonResidential', dwelling: 'n/a', grounds: [], places: [] },
};

// respond to autocomplete calls with stamped results, and to select calls with a bare 204, or
// with `enriched` when the project enriches
const mockAutocompleteApi = (response = 'first', enriched?: RadarAutocompleteEnrichedAddress) => {
  fetchMock.mockResponse(async (req) => {
    if (req.url.includes('/v1/config')) {
      return JSON.stringify({});
    }
    if (req.url.includes('/search/autocomplete/select')) {
      // a project that does not enrich answers 204 with no body
      return enriched
        ? { body: JSON.stringify({ meta: {}, address: enriched }), status: 200 }
        : { body: '', status: 204 };
    }
    return {
      body: JSON.stringify({ meta: {}, addresses: addressesFrom(response) }),
      status: 200,
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

/** lets the selection report's promise chain settle */
const flushReport = () => new Promise((resolve) => setTimeout(resolve, 0));

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

    await widget.fetchResults('111 5th ave');

    const url = new URL(String(autocompleteRequests()[0]![0] as string));
    expect(url.searchParams.get('sessionToken')).toMatch(UUID_PATTERN);
  });

  it('reuses the same session token across requests', async () => {
    const widget = mount();

    await widget.fetchResults('111 5th');
    await widget.fetchResults('111 5th ave');

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

    const results = await widget.fetchResults('111 5th ave');
    widget.displayResults(results);
    widget.select(1);
    await flushReport();

    const select = selectRequests()[0];
    expect(select).toBeDefined();
    expect(JSON.parse(select![1]!.body as string)).toEqual({
      resultId: 'v1_first-1',
      integration: INTEGRATION,
    });
  });

  it('tags autocomplete requests as widget-originated', async () => {
    const widget = mount();

    await widget.fetchResults('111 5th ave');

    const url = new URL(String(autocompleteRequests()[0]![0] as string));
    expect(url.searchParams.get('integration')).toEqual(INTEGRATION);
  });

  it('reports the selection against the most recent autocomplete response', async () => {
    const widget = mount();

    mockAutocompleteApi('stale');
    widget.displayResults(await widget.fetchResults('111 5th'));

    mockAutocompleteApi('current');
    widget.displayResults(await widget.fetchResults('111 5th ave'));

    widget.select(0);
    await flushReport();

    const select = selectRequests()[0];
    expect(JSON.parse(select![1]!.body as string)).toEqual({
      resultId: 'v1_current-0',
      integration: INTEGRATION,
    });
  });

  it('hands the enriched address to onEnrichment when the project enriches', async () => {
    mockAutocompleteApi('first', ENRICHED);
    const onEnrichment = jest.fn();
    const widget = mount({ onEnrichment });

    widget.displayResults(await widget.fetchResults('111 5th ave'));
    widget.select(0);
    await flushReport();

    expect(onEnrichment).toHaveBeenCalledWith(ENRICHED);
  });

  it('does not call onEnrichment when the project does not enrich', async () => {
    const onEnrichment = jest.fn();
    const widget = mount({ onEnrichment });

    widget.displayResults(await widget.fetchResults('111 5th ave'));
    widget.select(0);
    await flushReport();

    // the selection is still reported; there is just no enrichment to hand back
    expect(selectRequests()).toHaveLength(1);
    expect(onEnrichment).not.toHaveBeenCalled();
  });

  it('runs onSelection ahead of the report and onEnrichment after it', async () => {
    mockAutocompleteApi('first', ENRICHED);
    const order: string[] = [];
    const widget = mount({
      onSelection: () => order.push('selection'),
      onEnrichment: () => order.push('enrichment'),
    });

    widget.displayResults(await widget.fetchResults('111 5th ave'));
    widget.select(0);

    // the input is usable before the network answers
    expect(order).toEqual(['selection']);

    await flushReport();
    expect(order).toEqual(['selection', 'enrichment']);
  });

  it('reports a failed selection to neither onError nor onEnrichment', async () => {
    fetchMock.mockResponse(async (req) => {
      if (req.url.includes('/v1/config')) {
        return JSON.stringify({});
      }
      if (req.url.includes('/search/autocomplete/select')) {
        return { body: JSON.stringify({ meta: { code: 400 } }), status: 400 };
      }
      return { body: JSON.stringify({ meta: {}, addresses: addressesFrom('first') }), status: 200 };
    });
    const onError = jest.fn();
    const onEnrichment = jest.fn();
    const widget = mount({ onError, onEnrichment });

    widget.displayResults(await widget.fetchResults('111 5th ave'));
    widget.select(0);
    await flushReport();

    // the report is not something the user asked for, so its failure stays out of their way
    expect(selectRequests()).toHaveLength(1);
    expect(onError).not.toHaveBeenCalled();
    expect(onEnrichment).not.toHaveBeenCalled();
  });

  it('logs rather than rejects when onEnrichment throws', async () => {
    mockAutocompleteApi('first', ENRICHED);
    const warn = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    const widget = mount({
      onEnrichment: () => {
        throw new Error('consumer callback blew up');
      },
    });

    widget.displayResults(await widget.fetchResults('111 5th ave'));
    widget.select(0);
    await flushReport();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('consumer callback blew up'));
  });

  it('reports the selection even when onSelection throws', async () => {
    const widget = mount({
      onSelection: () => {
        throw new Error('consumer callback blew up');
      },
    });

    widget.displayResults(await widget.fetchResults('111 5th ave'));
    expect(() => widget.select(0)).toThrow('consumer callback blew up');
    await flushReport();

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

    widget.displayResults(await widget.fetchResults('111 5th ave'));
    widget.select(0);
    await flushReport();

    expect(selectRequests()).toHaveLength(0);
  });

  it("scopes each widget's requests to its own session token", async () => {
    document.body.innerHTML = '<div id="autocomplete"></div><div id="autocomplete-2"></div>';
    const first = mount();
    const second = mount({ container: 'autocomplete-2' });

    // serialized on purpose: both widgets share the 'autocomplete-ui' dedup key, so concurrent
    // fetches abort each other. that behavior predates session association and is deliberately left
    // alone, so this asserts only that session tokens do not leak between widgets.
    await first.fetchResults('111 5th');
    await second.fetchResults('120 fifth');

    const tokens = autocompleteRequests().map(([url]) =>
      new URL(String(url as string)).searchParams.get('sessionToken'),
    );
    expect(tokens).toEqual([first.sessionToken, second.sessionToken]);
    expect(first.sessionToken).not.toEqual(second.sessionToken);
  });

  it('does not report a selection when the selected index has no result', async () => {
    const widget = mount();

    widget.displayResults(await widget.fetchResults('111 5th ave'));
    widget.select(99);
    await flushReport();

    expect(selectRequests()).toHaveLength(0);
  });
});
