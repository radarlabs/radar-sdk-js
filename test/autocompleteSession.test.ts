import fetchMock from 'jest-fetch-mock';

import Radar, { AutocompleteSession } from '../src';
import { RadarBadRequestError } from '../src/errors';
import { getRequest, mockRequest } from './utils';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('AutocompleteSession', () => {
  const resultId = 'v1_QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGk';
  // exactly what /select returned against staging: two fields, nothing else
  const enriched = {
    formattedAddress: '123 Main St, New York, NY 10001 US',
    locationDetails: { usage: 'unknown', dwelling: 'unknown', grounds: [], places: [] },
  };

  beforeEach(() => {
    Radar.initialize('prj_test_pk_123');
  });

  afterEach(() => {
    Radar.clear();
    jest.restoreAllMocks();
  });

  it('mints its own token, so no caller can get one wrong', () => {
    const session = new AutocompleteSession();

    expect(session.sessionToken).toMatch(UUID_PATTERN);
  });

  it('gives each session a distinct token', () => {
    // the whole point of the type: a second address field gets a second session
    const billing = new AutocompleteSession();
    const shipping = new AutocompleteSession();

    expect(billing.sessionToken).not.toEqual(shipping.sessionToken);
  });

  it('keeps one token for the life of the session', async () => {
    const session = new AutocompleteSession();

    mockRequest(200, { addresses: [] });
    await session.autocomplete({ query: '123' });
    const first = getRequest().url;

    mockRequest(200, { addresses: [] });
    await session.autocomplete({ query: '123 Main' });
    const second = getRequest().url;

    expect(first).toContain(`sessionToken=${session.sessionToken}`);
    expect(second).toContain(`sessionToken=${session.sessionToken}`);
  });

  it('scopes requests to its own session, not another instance', async () => {
    const billing = new AutocompleteSession();
    const shipping = new AutocompleteSession();

    mockRequest(200, { addresses: [] });
    await billing.autocomplete({ query: '123 Main' });

    const url = getRequest().url;
    expect(url).toContain(`sessionToken=${billing.sessionToken}`);
    expect(url).not.toContain(shipping.sessionToken);
  });

  it('selects by posting only the handle', async () => {
    const session = new AutocompleteSession();
    mockRequest(204, '');

    await session.select({ resultId });

    const request = getRequest();
    expect(request.method).toEqual('POST');
    expect(request.url).toContain('/v1/search/autocomplete/select');
    expect(JSON.parse(request.body!)).toEqual({ resultId });
  });

  it('returns the enriched address when the project enriches', async () => {
    const session = new AutocompleteSession();
    mockRequest(200, { address: enriched });

    const response = await session.select({ resultId });

    expect(response.address).toEqual(enriched);
  });

  it('returns no address when the selection was only recorded', async () => {
    // a project without enrichment answers 204 with no body at all
    const session = new AutocompleteSession();
    mockRequest(204, '');

    const response = await session.select({ resultId });

    expect(response.address).toBeUndefined();
  });

  it('surfaces the enrichment fields and nothing more', async () => {
    const session = new AutocompleteSession();
    mockRequest(200, { address: enriched });

    const { address } = await session.select({ resultId });

    expect(Object.keys(address!).sort()).toEqual(['formattedAddress', 'locationDetails']);
    expect(address!.locationDetails.usage).toEqual('unknown');
    expect(address!.locationDetails.grounds).toEqual([]);
    expect(address!.locationDetails.places).toEqual([]);
  });

  it('rejects a result that carries no handle, without calling the API', async () => {
    const session = new AutocompleteSession();
    fetchMock.resetMocks();

    await expect(session.select({} as any)).rejects.toThrow(RadarBadRequestError);

    const selectCalls = fetchMock.mock.calls.filter(([url]) => String(url as string).includes('/autocomplete/select'));
    expect(selectCalls).toHaveLength(0);
  });

  it('swallows an expired session rather than breaking the caller', async () => {
    const session = new AutocompleteSession();
    mockRequest(400, { meta: { code: 400 } });

    await expect(session.select({ resultId })).resolves.toEqual({});
  });
});
