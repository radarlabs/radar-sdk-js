import Logger from './logger';

/** Minimal Cloudflare `application/dns-json` shapes we read; see RFC 8484 JSON mapping */
interface DnsJsonAnswer {
  name: string;
  type: number;
  TTL?: number;
  data: string;
}

interface DnsJsonResponse {
  Status: number;
  Answer?: DnsJsonAnswer[];
}

const CLOUDFLARE_DOH_JSON = 'https://cloudflare-dns.com/dns-query';

export type DnsProbeResult =
  | {
      status: 'success';
      hostname: string;
      resolver: 'cloudflare-dns.com';
      dnsStatus: number;
      ipv4Answers: string[];
    }
  | {
      status: 'no_answers';
      hostname: string;
      resolver: 'cloudflare-dns.com';
      dnsStatus: number;
      answerCount: number;
      note: string;
    }
  | { status: 'http_error'; hostname: string; resolver: 'cloudflare-dns.com'; httpStatus: number }
  | { status: 'fetch_error'; hostname: string; resolver: 'cloudflare-dns.com'; errorMessage: string };

/** hostname -> already ran a probe this session */
const dnsProbeScheduledForHostname = new Set<string>();

function getDnsProbeAbortSignal(): AbortSignal | undefined {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(8000);
  }
  return undefined;
}

async function dnsLookupAJson(
  hostname: string,
): Promise<{ kind: 'ok'; data: DnsJsonResponse } | { kind: 'http_error'; httpStatus: number }> {
  const query = new URL(CLOUDFLARE_DOH_JSON);
  query.searchParams.set('name', hostname);
  query.searchParams.set('type', 'A');

  const res = await fetch(query.toString(), {
    headers: { Accept: 'application/dns-json' },
    signal: getDnsProbeAbortSignal(),
  });

  if (!res.ok) {
    return { kind: 'http_error', httpStatus: res.status };
  }

  return { kind: 'ok', data: (await res.json()) as DnsJsonResponse };
}

async function runDnsOverHttpsProbe(hostname: string, correlation: Record<string, unknown>): Promise<DnsProbeResult> {
  try {
    const outcome = await dnsLookupAJson(hostname);

    if (outcome.kind === 'http_error') {
      const result: DnsProbeResult = {
        status: 'http_error',
        hostname,
        resolver: 'cloudflare-dns.com',
        httpStatus: outcome.httpStatus,
      };
      Logger.error(`DNS-over-HTTPS HTTP error (${hostname})`, {
        resolver: 'cloudflare-dns.com',
        httpStatus: outcome.httpStatus,
        correlation,
      });
      return result;
    }

    const data = outcome.data;
    const ips = data.Status === 0 && Array.isArray(data.Answer) ? data.Answer.map((a) => a.data).filter(Boolean) : [];

    if (ips.length > 0) {
      const result: DnsProbeResult = {
        status: 'success',
        hostname,
        resolver: 'cloudflare-dns.com',
        dnsStatus: data.Status,
        ipv4Answers: ips,
      };
      Logger.error(`DNS-over-HTTPS (${hostname})`, {
        resolver: 'cloudflare-dns.com',
        dnsStatus: data.Status,
        ipv4Answers: ips,
        correlation,
      });
      return result;
    }

    const note =
      data.Status !== 0
        ? `Resolver returned DNS status ${String(data.Status)} (non-zero)`
        : 'No IPv4 Answer records returned';

    const result: DnsProbeResult = {
      status: 'no_answers',
      hostname,
      resolver: 'cloudflare-dns.com',
      dnsStatus: data.Status,
      answerCount: Array.isArray(data.Answer) ? data.Answer.length : 0,
      note,
    };

    Logger.error(`DNS-over-HTTPS (${hostname})`, {
      resolver: 'cloudflare-dns.com',
      dnsStatus: data.Status,
      answerCount: result.answerCount,
      correlation,
      note,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const result: DnsProbeResult = {
      status: 'fetch_error',
      hostname,
      resolver: 'cloudflare-dns.com',
      errorMessage: message,
    };
    Logger.error(`DNS-over-HTTPS probe failed (${hostname})`, {
      resolver: 'cloudflare-dns.com',
      errorMessage: message,
      correlation,
    });
    return result;
  }
}

/**
 * Runs at most one DoH probe per hostname per page load. Returns a promise you can await
 * from `RadarNetworkError.dnsProbe` — does not block the throwing error path.
 */
export function scheduleDnsOverHttpsProbe(
  hostname: string | undefined,
  correlation: Record<string, unknown>,
): Promise<DnsProbeResult> | null {
  if (!hostname || hostname.length === 0) {
    return null;
  }

  if (typeof window !== 'undefined' && window.RADAR_TEST_ENV === true) {
    return null;
  }

  if (dnsProbeScheduledForHostname.has(hostname)) {
    return null;
  }
  dnsProbeScheduledForHostname.add(hostname);

  return runDnsOverHttpsProbe(hostname, correlation);
}
