const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const CONCURRENCY_LIMIT = 3;
const GATEWAY_TIMEOUT = 30000;
const GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
];

interface UploadResult {
  cid: string;
  size: number;
}

class IPFSCache {
  private cache = new Map<string, { data: Blob; timestamp: number }>();
  private maxAge = 3600000; // 1 hour

  set(cid: string, data: Blob) {
    this.cache.set(cid, { data, timestamp: Date.now() });
  }

  get(cid: string): Blob | null {
    const entry = this.cache.get(cid);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(cid);
      return null;
    }
    return entry.data;
  }
}

class IPFSService {
  private cache = new IPFSCache();
  private uploadQueue: Array<() => Promise<any>> = [];
  private activeUploads = 0;

  async upload(file: File, apiKey: string): Promise<UploadResult> {
    if (file.size > CHUNK_SIZE) {
      return this.chunkedUpload(file, apiKey);
    }
    return this.singleUpload(file, apiKey);
  }

  private async singleUpload(file: File, apiKey: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return { cid: data.IpfsHash, size: file.size };
  }

  private async chunkedUpload(file: File, apiKey: string): Promise<UploadResult> {
    const chunks: Blob[] = [];
    for (let i = 0; i < file.size; i += CHUNK_SIZE) {
      chunks.push(file.slice(i, i + CHUNK_SIZE));
    }

    const uploadChunk = async (chunk: Blob, index: number) => {
      const chunkFile = new File([chunk], `${file.name}.part${index}`);
      return this.singleUpload(chunkFile, apiKey);
    };

    const results = await this.parallelUpload(chunks.map((chunk, i) => () => uploadChunk(chunk, i)));
    
    // Return first chunk CID as main reference
    return results[0];
  }

  private async parallelUpload<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = (async () => {
        this.activeUploads++;
        try {
          results.push(await task());
        } finally {
          this.activeUploads--;
        }
      })();

      executing.push(promise);

      if (executing.length >= CONCURRENCY_LIMIT) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  async retrieve(cid: string): Promise<Blob> {
    const cached = this.cache.get(cid);
    if (cached) return cached;

    for (const gateway of GATEWAYS) {
      try {
        const response = await this.fetchWithTimeout(`${gateway}${cid}`, GATEWAY_TIMEOUT);
        if (response.ok) {
          const blob = await response.blob();
          this.cache.set(cid, blob);
          return blob;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('All gateways failed');
  }

  private fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    return Promise.race([
      fetch(url),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }
}

export const ipfsService = new IPFSService();
