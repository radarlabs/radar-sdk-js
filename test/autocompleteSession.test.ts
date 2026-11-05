import Radar, { AutocompleteSession } from '../src';
import { RadarBadRequestError } from '../src/errors';
import { UUID_PATTERN } from '../src/uuid';
import { getRequest, mockRequest } from './utils';

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

  it('resumes a session from a token minted elsewhere', async () => {
    const token = 'ffbcb2ca-1d1c-4f96-9b91-fd0b0b0e1b7f';
    const session = new AutocompleteSession(token);

    expect(session.sessionToken).toEqual(token);

    mockRequest(200, { addresses: [] });
    await session.autocomplete({ query: '123' });

    expect(getRequest().url).toContain(`sessionToken=${token}`);
  });

  it('refuses a resumed token that is not a UUID', () => {
    for (const bad of ['not-a-uuid', '', '1-1-1-1-1']) {
      expect(() => new AutocompleteSession(bad)).toThrow(RadarBadRequestError);
    }
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
});
