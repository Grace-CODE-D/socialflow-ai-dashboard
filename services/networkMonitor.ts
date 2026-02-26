import { NetworkRequest } from '../types';

type NetworkRequestListener = (request: NetworkRequest) => void;

class NetworkMonitor {
  private listeners: NetworkRequestListener[] = [];
  private requests: NetworkRequest[] = [];
  private isMonitoring = false;
  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = window.fetch;
  }

  subscribe(listener: NetworkRequestListener): () => void {
    this.listeners.push(listener);
    
    if (!this.isMonitoring) {
      this.startMonitoring();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (this.listeners.length === 0) {
        this.stopMonitoring();
      }
    };
  }

  getRequests(): NetworkRequest[] {
    return [...this.requests];
  }

  clearRequests(): void {
    this.requests = [];
  }

  private startMonitoring(): void {
    this.isMonitoring = true;
    this.interceptFetch();
  }

  private stopMonitoring(): void {
    this.isMonitoring = false;
    window.fetch = this.originalFetch;
  }

  private interceptFetch(): void {
    const self = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      try {
        const response = await self.originalFetch(input, init);
        const endTime = Date.now();
        
        const networkRequest: NetworkRequest = {
          id: requestId,
          method: method as NetworkRequest['method'],
          url,
          status: response.status,
          duration: endTime - startTime,
          timestamp: new Date(startTime),
          requestHeaders: self.extractHeaders(init?.headers),
          responseHeaders: self.extractResponseHeaders(response.headers),
          requestBody: init?.body,
          responseBody: await self.cloneAndReadResponse(response)
        };

        self.addRequest(networkRequest);
        return response;
      } catch (error) {
        const endTime = Date.now();
        
        const networkRequest: NetworkRequest = {
          id: requestId,
          method: method as NetworkRequest['method'],
          url,
          status: 0,
          duration: endTime - startTime,
          timestamp: new Date(startTime),
          requestHeaders: self.extractHeaders(init?.headers),
          responseHeaders: {},
          requestBody: init?.body,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        self.addRequest(networkRequest);
        throw error;
      }
    };
  }

  private extractHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};
    
    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    
    if (Array.isArray(headers)) {
      const result: Record<string, string> = {};
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
      return result;
    }
    
    return headers as Record<string, string>;
  }

  private extractResponseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private async cloneAndReadResponse(response: Response): Promise<any> {
    try {
      const cloned = response.clone();
      const text = await cloned.text();
      
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return null;
    }
  }

  private addRequest(request: NetworkRequest): void {
    this.requests.unshift(request);
    
    // Keep only last 100 requests
    if (this.requests.length > 100) {
      this.requests = this.requests.slice(0, 100);
    }
    
    this.notifyListeners(request);
  }

  private notifyListeners(request: NetworkRequest): void {
    this.listeners.forEach(listener => listener(request));
  }
}

export const networkMonitor = new NetworkMonitor();