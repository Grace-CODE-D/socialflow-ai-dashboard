/**
 * Integration test for configureApi(): asserts that once the generated
 * OpenAPI client is configured with a base URL and token getter, a real
 * generated service call (WebhooksService.getWebhooks) actually sends the
 * configured Authorization header to the configured base URL.
 */
import { configureApi } from '../configure';
import { OpenAPI } from '../core/OpenAPI';
import { WebhooksService } from '../services/WebhooksService';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    url: '',
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('configureApi', () => {
  afterEach(() => {
    mockFetch.mockReset();
    OpenAPI.BASE = '/api/v1';
    OpenAPI.TOKEN = undefined;
  });

  it('wires OpenAPI.BASE and OpenAPI.TOKEN from the provided options', () => {
    configureApi({ baseUrl: 'https://api.example.com', getToken: () => 'abc123' });

    expect(OpenAPI.BASE).toBe('https://api.example.com');
    expect(typeof OpenAPI.TOKEN).toBe('function');
  });

  it('sends the configured Authorization header on a real generated service call', async () => {
    configureApi({
      baseUrl: 'https://api.example.com',
      getToken: () => 'test-access-token',
    });

    mockFetch.mockResolvedValueOnce(jsonResponse([]));

    await WebhooksService.getWebhooks();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/webhooks');
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-access-token');
  });

  it('omits the Authorization header when no token is available', async () => {
    configureApi({ baseUrl: 'https://api.example.com', getToken: () => undefined });

    mockFetch.mockResolvedValueOnce(jsonResponse([]));

    await WebhooksService.getWebhooks();

    const [, init] = mockFetch.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });
});
