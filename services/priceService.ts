import axios from 'axios';

interface PriceCache {
  [key: string]: { price: number; timestamp: number };
}

// CoinGecko ID mapping for common Stellar tokens
const TOKEN_IDS: { [key: string]: string } = {
  'XLM': 'stellar',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'EURC': 'eurc',
  'AQUA': 'aqua',
  'META': 'meta',
  'SGB': 'songbird',
};

class PriceService {
  private cache: PriceCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getTokenId(assetCode: string): string | null {
    return TOKEN_IDS[assetCode.toUpperCase()] || null;
  }

  async getPrice(assetCode: string, currency: string = 'USD'): Promise<number> {
    const cacheKey = `${assetCode}-${currency}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.price;
    }

    try {
      const tokenId = this.getTokenId(assetCode);
      
      if (tokenId) {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=${currency.toLowerCase()}`
        );
        const price = response.data[tokenId]?.[currency.toLowerCase()] || 0;
        this.cache[cacheKey] = { price, timestamp: Date.now() };
        return price;
      }
      
      // For unknown tokens, return 0 (they might not have a price on CoinGecko)
      return 0;
    } catch (error) {
      console.error('Failed to fetch price:', error);
      return cached?.price || 0;
    }
  }

  async getPricesForMultipleAssets(
    assetCodes: string[], 
    currency: string = 'USD'
  ): Promise<{ [key: string]: number }> {
    const prices: { [key: string]: number } = {};
    const tokenIds = assetCodes
      .map(code => this.getTokenId(code))
      .filter((id): id is string => id !== null);

    if (tokenIds.length === 0) return prices;

    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=${currency.toLowerCase()}`
      );

      assetCodes.forEach(code => {
        const tokenId = this.getTokenId(code);
        if (tokenId && response.data[tokenId]) {
          prices[code] = response.data[tokenId][currency.toLowerCase()] || 0;
        } else {
          prices[code] = 0;
        }
      });
    } catch (error) {
      console.error('Failed to fetch multiple prices:', error);
      // Return cached prices or 0 for each asset
      assetCodes.forEach(code => {
        const cached = this.cache[`${code}-${currency}`];
        prices[code] = cached?.price || 0;
      });
    }

    return prices;
  }

  async convertToFiat(amount: string, assetCode: string, currency: string = 'USD'): Promise<number> {
    const price = await this.getPrice(assetCode, currency);
    return parseFloat(amount) * price;
  }

  async convertMultipleToFiat(
    amounts: { code: string; amount: string }[],
    currency: string = 'USD'
  ): Promise<number> {
    const codes = amounts.map(a => a.code);
    const prices = await this.getPricesForMultipleAssets(codes, currency);
    
    return amounts.reduce((total, item) => {
      const price = prices[item.code] || 0;
      return total + (parseFloat(item.amount) * price);
    }, 0);
  }

  // Get supported currencies
  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW'];
  }

  // Check if an asset has price data
  async hasPriceData(assetCode: string): Promise<boolean> {
    const price = await this.getPrice(assetCode);
    return price > 0;
  }

  // Clear cache (useful for manual refresh)
  clearCache(): void {
    this.cache = {};
  }
}

export default new PriceService();
