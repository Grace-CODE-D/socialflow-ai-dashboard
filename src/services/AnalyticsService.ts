/**
 * @fileoverview Social Media Analytics Aggregation Service
 * Fetches, normalizes, stores, and schedules analytics data across platforms.
 */

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'tiktok';

/** Normalized analytics record — consistent shape regardless of source platform. */
export interface PostAnalytics {
  /** Composite key: `{platform}:{postId}` */
  id: string;
  platform: Platform;
  postId: string;
  /** Unix ms timestamp of the post */
  postedAt: number;
  likes: number;
  shares: number;
  views: number;
  comments: number;
  /** Unix ms timestamp of last sync */
  syncedAt: number;
}

// ---------------------------------------------------------------------------
// IndexedDB storage
// ---------------------------------------------------------------------------

const DB_NAME = 'SocialFlowAnalytics';
const DB_VERSION = 1;
const STORE = 'postAnalytics';

class AnalyticsDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('platform', 'platform', { unique: false });
          store.createIndex('syncedAt', 'syncedAt', { unique: false });
          store.createIndex('postedAt', 'postedAt', { unique: false });
        }
      };
    });
  }

  private tx(mode: IDBTransactionMode) {
    if (!this.db) throw new Error('AnalyticsDB not initialized');
    return this.db.transaction([STORE], mode).objectStore(STORE);
  }

  async upsertMany(records: PostAnalytics[]): Promise<void> {
    if (!this.db) throw new Error('AnalyticsDB not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE], 'readwrite');
      const store = tx.objectStore(STORE);
      records.forEach(r => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getByPlatform(platform: Platform): Promise<PostAnalytics[]> {
    return new Promise((resolve, reject) => {
      const req = this.tx('readonly').index('platform').getAll(platform);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(): Promise<PostAnalytics[]> {
    return new Promise((resolve, reject) => {
      const req = this.tx('readonly').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getByDateRange(from: number, to: number): Promise<PostAnalytics[]> {
    return new Promise((resolve, reject) => {
      const req = this.tx('readonly').index('postedAt').getAll(IDBKeyRange.bound(from, to));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export const analyticsDB = new AnalyticsDB();

// ---------------------------------------------------------------------------
// Platform fetchers
// Each fetcher returns normalized PostAnalytics[]. Replace stub bodies with
// real API calls once platform credentials are available.
// ---------------------------------------------------------------------------

type Fetcher = (accountId: string) => Promise<PostAnalytics[]>;

const fetchTwitter: Fetcher = async (accountId) => {
  // TODO: call Twitter/X API v2 GET /2/users/:id/tweets with metrics
  console.debug('[Analytics] Twitter fetch stub for', accountId);
  return [];
};

const fetchLinkedIn: Fetcher = async (accountId) => {
  // TODO: call LinkedIn Share Statistics API
  console.debug('[Analytics] LinkedIn fetch stub for', accountId);
  return [];
};

const fetchInstagram: Fetcher = async (accountId) => {
  // TODO: call Instagram Graph API /media?fields=like_count,comments_count
  console.debug('[Analytics] Instagram fetch stub for', accountId);
  return [];
};

const fetchTikTok: Fetcher = async (accountId) => {
  // TODO: call TikTok Research API /video/query/
  console.debug('[Analytics] TikTok fetch stub for', accountId);
  return [];
};

const FETCHERS: Record<Platform, Fetcher> = {
  twitter: fetchTwitter,
  linkedin: fetchLinkedIn,
  instagram: fetchInstagram,
  tiktok: fetchTikTok,
};

// ---------------------------------------------------------------------------
// AnalyticsService
// ---------------------------------------------------------------------------

export class AnalyticsService {
  private schedulerHandle: ReturnType<typeof setInterval> | null = null;

  /** Fetch + store analytics for all enabled platforms. */
  async sync(accountIds: Partial<Record<Platform, string>>): Promise<void> {
    await analyticsDB.init();
    const now = Date.now();

    const results = await Promise.allSettled(
      (Object.entries(accountIds) as [Platform, string][]).map(async ([platform, id]) => {
        const records = await FETCHERS[platform](id);
        const stamped = records.map(r => ({ ...r, syncedAt: now }));
        if (stamped.length) await analyticsDB.upsertMany(stamped);
      })
    );

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[Analytics] sync failed for platform index ${i}:`, r.reason);
      }
    });
  }

  /**
   * Start scheduled sync.
   * @param accountIds  Map of platform → account/user ID
   * @param intervalMs  Polling interval in ms (default: 15 minutes)
   */
  startScheduler(
    accountIds: Partial<Record<Platform, string>>,
    intervalMs = 15 * 60 * 1000
  ): void {
    if (this.schedulerHandle) return; // already running
    this.sync(accountIds); // immediate first run
    this.schedulerHandle = setInterval(() => this.sync(accountIds), intervalMs);
  }

  stopScheduler(): void {
    if (this.schedulerHandle) {
      clearInterval(this.schedulerHandle);
      this.schedulerHandle = null;
    }
  }

  // Convenience read methods for dashboard charts

  async getAll(): Promise<PostAnalytics[]> {
    await analyticsDB.init();
    return analyticsDB.getAll();
  }

  async getByPlatform(platform: Platform): Promise<PostAnalytics[]> {
    await analyticsDB.init();
    return analyticsDB.getByPlatform(platform);
  }

  async getByDateRange(from: number, to: number): Promise<PostAnalytics[]> {
    await analyticsDB.init();
    return analyticsDB.getByDateRange(from, to);
  }
}

export const analyticsService = new AnalyticsService();
