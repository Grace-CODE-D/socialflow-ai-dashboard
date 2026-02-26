/**
 * AnalyticsService - Aggregates data from social media and blockchain sources
 * 
 * Provides unified analytics for:
 * - Social media performance (followers, engagement)
 * - Blockchain wallet value (XLM + tokens)
 * - Cross-platform metrics
 * - Historical data tracking
 */

export interface SocialMetrics {
    platform: string;
    followers: number;
    engagement: number;
    posts: number;
    reach: number;
}

export interface WalletMetrics {
    xlmBalance: number;
    tokenValue: number;
    totalValue: number;
    assets: Array<{
        code: string;
        balance: number;
        value: number;
    }>;
}

export interface PerformanceData {
    date: string;
    followers: number;
    walletValue: number;
    engagement: number;
    xlmSpent: number;
}

export interface TopPost {
    id: string;
    platform: string;
    content: string;
    engagement: number;
    value: number;
    date: string;
    likes: number;
    comments: number;
    shares: number;
}

export interface RewardDistribution {
    date: string;
    amount: number;
    recipients: number;
    campaign: string;
}

export interface AggregatedData {
    totalFollowers: number;
    followerGrowth: number;
    totalWalletValue: number;
    walletGrowth: number;
    engagementRate: number;
    xlmSpent: number;
    socialMetrics: SocialMetrics[];
    walletMetrics: WalletMetrics;
    performanceHistory: PerformanceData[];
    topPosts: TopPost[];
    rewardDistributions: RewardDistribution[];
}

class AnalyticsService {
    private storageKey = 'socialflow_analytics_data';

    /**
     * Get aggregated analytics data
     */
    async getAggregatedData(timeRange: '7d' | '30d' = '7d'): Promise<AggregatedData> {
        // In production, this would fetch from APIs and blockchain
        // For now, we'll use mock data with localStorage persistence

        const days = timeRange === '7d' ? 7 : 30;
        const storedData = this.getStoredData();

        return {
            totalFollowers: storedData.totalFollowers || 892400,
            followerGrowth: timeRange === '7d' ? 12.5 : 18.3,
            totalWalletValue: storedData.totalWalletValue || 45678.90,
            walletGrowth: timeRange === '7d' ? 8.2 : 15.7,
            engagementRate: timeRange === '7d' ? 5.8 : 6.1,
            xlmSpent: storedData.xlmSpent || 1250.50,
            socialMetrics: this.getSocialMetrics(),
            walletMetrics: this.getWalletMetrics(),
            performanceHistory: this.generatePerformanceHistory(days),
            topPosts: this.getTopPosts(timeRange),
            rewardDistributions: this.getRewardDistributions(days),
        };
    }

    /**
     * Get social media metrics by platform
     */
    private getSocialMetrics(): SocialMetrics[] {
        return [
            { platform: 'Instagram', followers: 450000, engagement: 6.2, posts: 145, reach: 1200000 },
            { platform: 'TikTok', followers: 280000, engagement: 8.5, posts: 89, reach: 890000 },
            { platform: 'YouTube', followers: 120000, engagement: 4.8, posts: 56, reach: 450000 },
            { platform: 'Facebook', followers: 32400, engagement: 3.2, posts: 78, reach: 180000 },
            { platform: 'LinkedIn', followers: 10000, engagement: 5.1, posts: 34, reach: 45000 },
        ];
    }

    /**
     * Get wallet metrics
     */
    private getWalletMetrics(): WalletMetrics {
        const assets = [
            { code: 'XLM', balance: 125000, value: 15625 },
            { code: 'USDC', balance: 25000, value: 25000 },
            { code: 'SOCIAL', balance: 50000, value: 5000 },
            { code: 'REWARD', balance: 10000, value: 53.90 },
        ];

        const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
        const xlmBalance = assets.find(a => a.code === 'XLM')?.balance || 0;
        const tokenValue = totalValue - (assets.find(a => a.code === 'XLM')?.value || 0);

        return {
            xlmBalance,
            tokenValue,
            totalValue,
            assets,
        };
    }

    /**
     * Generate performance history data
     */
    private generatePerformanceHistory(days: number): PerformanceData[] {
        const history: PerformanceData[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Generate realistic trending data
            const baseFollowers = 850000;
            const followerGrowth = (days - i) * 600 + Math.random() * 1000;

            const baseWalletValue = 40000;
            const walletGrowth = (days - i) * 200 + Math.random() * 500;

            const baseEngagement = 5.0;
            const engagementVariation = Math.sin(i / 3) * 0.5 + Math.random() * 0.3;

            history.push({
                date: date.toISOString().split('T')[0],
                followers: Math.floor(baseFollowers + followerGrowth),
                walletValue: baseWalletValue + walletGrowth,
                engagement: baseEngagement + engagementVariation,
                xlmSpent: Math.random() * 100 + 20,
            });
        }

        return history;
    }

    /**
     * Get top performing posts
     */
    private getTopPosts(timeRange: '7d' | '30d'): TopPost[] {
        const posts: TopPost[] = [
            {
                id: '1',
                platform: 'Instagram',
                content: 'Exciting announcement about our new Web3 integration! 🚀',
                engagement: 15420,
                value: 450.50,
                date: '2024-02-18',
                likes: 12500,
                comments: 2420,
                shares: 500,
            },
            {
                id: '2',
                platform: 'TikTok',
                content: 'Behind the scenes of our latest campaign',
                engagement: 28900,
                value: 680.20,
                date: '2024-02-17',
                likes: 25000,
                comments: 3200,
                shares: 700,
            },
            {
                id: '3',
                platform: 'YouTube',
                content: 'Complete guide to blockchain rewards',
                engagement: 8750,
                value: 320.80,
                date: '2024-02-16',
                likes: 7200,
                comments: 1450,
                shares: 100,
            },
            {
                id: '4',
                platform: 'LinkedIn',
                content: 'How we scaled our social media presence with AI',
                engagement: 4200,
                value: 180.40,
                date: '2024-02-15',
                likes: 3500,
                comments: 650,
                shares: 50,
            },
            {
                id: '5',
                platform: 'Facebook',
                content: 'Community spotlight: Meet our top contributors',
                engagement: 3850,
                value: 125.60,
                date: '2024-02-14',
                likes: 3200,
                comments: 580,
                shares: 70,
            },
        ];

        return timeRange === '7d' ? posts : posts.concat([
            {
                id: '6',
                platform: 'Instagram',
                content: 'Monthly recap and what\'s coming next',
                engagement: 11200,
                value: 380.90,
                date: '2024-02-10',
                likes: 9800,
                comments: 1300,
                shares: 100,
            },
        ]);
    }

    /**
     * Get reward distribution timeline
     */
    private getRewardDistributions(days: number): RewardDistribution[] {
        const distributions: RewardDistribution[] = [];
        const now = new Date();

        // Generate weekly distributions
        for (let i = 0; i < Math.ceil(days / 7); i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (i * 7));

            distributions.push({
                date: date.toISOString().split('T')[0],
                amount: Math.random() * 500 + 200,
                recipients: Math.floor(Math.random() * 50 + 20),
                campaign: `Campaign ${String.fromCharCode(65 + i)}`,
            });
        }

        return distributions.reverse();
    }

    /**
     * Get stored data from localStorage
     */
    private getStoredData(): Partial<AggregatedData> {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    /**
     * Update stored data
     */
    updateStoredData(data: Partial<AggregatedData>): void {
        try {
            const current = this.getStoredData();
            const updated = { ...current, ...data };
            localStorage.setItem(this.storageKey, JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to update stored data:', error);
        }
    }

    /**
     * Export performance report
     */
    async exportReport(format: 'pdf' | 'csv', timeRange: '7d' | '30d'): Promise<void> {
        const data = await this.getAggregatedData(timeRange);

        if (format === 'csv') {
            this.exportCSV(data, timeRange);
        } else {
            this.exportPDF(data, timeRange);
        }
    }

    /**
     * Export data as CSV
     */
    private exportCSV(data: AggregatedData, timeRange: string): void {
        const csvRows: string[] = [];

        // Header
        csvRows.push('SocialFlow Performance Report');
        csvRows.push(`Time Range: ${timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}`);
        csvRows.push(`Generated: ${new Date().toLocaleString()}`);
        csvRows.push('');

        // Summary
        csvRows.push('Summary');
        csvRows.push('Metric,Value,Growth');
        csvRows.push(`Total Followers,${data.totalFollowers},${data.followerGrowth}%`);
        csvRows.push(`Total Wallet Value,$${data.totalWalletValue.toFixed(2)},${data.walletGrowth}%`);
        csvRows.push(`Engagement Rate,${data.engagementRate}%,`);
        csvRows.push(`XLM Spent,${data.xlmSpent} XLM,`);
        csvRows.push('');

        // Performance History
        csvRows.push('Performance History');
        csvRows.push('Date,Followers,Wallet Value,Engagement Rate,XLM Spent');
        data.performanceHistory.forEach(row => {
            csvRows.push(`${row.date},${row.followers},${row.walletValue.toFixed(2)},${row.engagement.toFixed(2)},${row.xlmSpent.toFixed(2)}`);
        });
        csvRows.push('');

        // Top Posts
        csvRows.push('Top Posts');
        csvRows.push('Platform,Content,Engagement,Value,Date');
        data.topPosts.forEach(post => {
            csvRows.push(`${post.platform},"${post.content}",${post.engagement},${post.value},${post.date}`);
        });

        // Create and download
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `socialflow-report-${timeRange}-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export data as PDF (simplified - in production use a PDF library)
     */
    private exportPDF(data: AggregatedData, timeRange: string): void {
        // For now, create a printable HTML page
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) {
            alert('Please allow popups to export PDF');
            return;
        }

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SocialFlow Performance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #3b82f6; }
          h2 { color: #334155; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; font-weight: 600; }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { padding: 20px; background: #f8fafc; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .stat-label { color: #64748b; margin-top: 5px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>SocialFlow Performance Report</h1>
        <p><strong>Time Range:</strong> ${timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

        <h2>Summary</h2>
        <div class="summary">
          <div class="stat-card">
            <div class="stat-value">${data.totalFollowers.toLocaleString()}</div>
            <div class="stat-label">Total Followers (+${data.followerGrowth}%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">$${data.totalWalletValue.toFixed(2)}</div>
            <div class="stat-label">Total Wallet Value (+${data.walletGrowth}%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.engagementRate}%</div>
            <div class="stat-label">Engagement Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.xlmSpent} XLM</div>
            <div class="stat-label">XLM Spent on Promotions</div>
          </div>
        </div>

        <h2>Top Performing Posts</h2>
        <table>
          <thead>
            <tr>
              <th>Platform</th>
              <th>Content</th>
              <th>Engagement</th>
              <th>Value</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.topPosts.map(post => `
              <tr>
                <td>${post.platform}</td>
                <td>${post.content}</td>
                <td>${post.engagement.toLocaleString()}</td>
                <td>$${post.value.toFixed(2)}</td>
                <td>${post.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Social Media Metrics</h2>
        <table>
          <thead>
            <tr>
              <th>Platform</th>
              <th>Followers</th>
              <th>Engagement</th>
              <th>Posts</th>
              <th>Reach</th>
            </tr>
          </thead>
          <tbody>
            ${data.socialMetrics.map(metric => `
              <tr>
                <td>${metric.platform}</td>
                <td>${metric.followers.toLocaleString()}</td>
                <td>${metric.engagement}%</td>
                <td>${metric.posts}</td>
                <td>${metric.reach.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <button onclick="window.print()" style="margin-top: 30px; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
          Print / Save as PDF
        </button>
      </body>
      </html>
    `;

        reportWindow.document.write(html);
        reportWindow.document.close();
    }
}

export const analyticsService = new AnalyticsService();
