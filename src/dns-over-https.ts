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

/** hostname -> already scheduled a probe this session */
const dnsProbeScheduledForHostname = new Set<string>();

function getDnsProbeAbortSignal(): AbortSignal | undefined {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(8000);
  }
  return undefined;
}

async function dnsLookupA(hostname: string, correlation: Record<string, unknown>): Promise<DnsJsonResponse | null> {
  const query = new URL(CLOUDFLARE_DOH_JSON);
  query.searchParams.set('name', hostname);
  query.searchParams.set('type', 'A');

  const res = await fetch(query.toString(), {
    headers: { Accept: 'application/dns-json' },
    signal: getDnsProbeAbortSignal(),
  });

  if (!res.ok) {
    Logger.error(`DNS-over-HTTPS HTTP error (${hostname})`, {
      resolver: 'cloudflare-dns.com',
      httpStatus: res.status,
      correlation,
    });
    return null;
  }

  return (await res.json()) as DnsJsonResponse;
}

/**
 * Runs at most once per hostname per page load after an API fetch fails without a response.
 * Uses Cloudflare's public resolver (RFC 8484 JSON) — does not block the throwing error path.
 */
export function scheduleDnsOverHttpsProbe(hostname: string | undefined, correlation: Record<string, unknown>): void {
  if (!hostname || hostname.length === 0) {
    return;
  }

  // skip secondary network traffic in jest
  if (typeof window !== 'undefined' && window.RADAR_TEST_ENV === true) {
    return;
  }

  if (dnsProbeScheduledForHostname.has(hostname)) {
    return;
  }
  dnsProbeScheduledForHostname.add(hostname);

  void (async (): Promise<void> => {
    try {
      const data = await dnsLookupA(hostname, correlation);
      if (data === null) {
        return;
      }

      const ips = data.Status === 0 && Array.isArray(data.Answer) ? data.Answer.map((a) => a.data).filter(Boolean) : [];

      if (ips.length > 0) {
        Logger.error(`DNS-over-HTTPS (${hostname})`, {
          resolver: 'cloudflare-dns.com',
          dnsStatus: data.Status,
          ipv4Answers: ips,
          correlation,
        });
      } else {
        Logger.error(`DNS-over-HTTPS (${hostname})`, {
          resolver: 'cloudflare-dns.com',
          dnsStatus: data.Status,
          answerCount: Array.isArray(data.Answer) ? data.Answer.length : 0,
          correlation,
          note:
            data.Status !== 0
              ? `Resolver returned DNS status ${String(data.Status)} (non-zero)`
              : 'No IPv4 Answer records returned',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Logger.error(`DNS-over-HTTPS probe failed (${hostname})`, {
        resolver: 'cloudflare-dns.com',
        errorMessage: message,
        correlation,
      });
    }
  })();
}
