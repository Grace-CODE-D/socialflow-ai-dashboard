import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountPerformance } from '../AccountPerformance';
import { analyticsService } from '../../services/analyticsService';

// Mock the analytics service
jest.mock('../../services/analyticsService', () => ({
  analyticsService: {
    getAggregatedData: jest.fn(),
    exportReport: jest.fn(),
  },
}));

const mockData = {
  totalFollowers: 125000,
  followerGrowth: 5.9,
  totalWalletValue: 15420.50,
  walletGrowth: 8.6,
  engagementRate: 4.8,
  xlmSpent: 245.30,
  performanceHistory: [
    { date: '2026-02-17', walletValue: 14200, followers: 118000, engagement: 4.2, xlmSpent: 35.5 },
    { date: '2026-02-24', walletValue: 15420, followers: 125000, engagement: 4.8, xlmSpent: 30.2 },
  ],
  topPosts: [
    { platform: 'TikTok', engagement: 45000, value: 125.50 },
    { platform: 'Instagram', engagement: 32000, value: 98.30 },
  ],
  rewardDistributions: [
    { campaign: 'Engagement Rewards', recipients: 150, amount: 500.00, date: '2026-02-20' },
  ],
  walletMetrics: {
    assets: [
      { code: 'XLM', balance: 10000, value: 5000.00 },
      { code: 'USDC', balance: 5000, value: 5000.00 },
    ],
  },
  socialMetrics: [
    { platform: 'TikTok', followers: 50000, engagement: 5.2, posts: 15 },
    { platform: 'Instagram', followers: 40000, engagement: 4.5, posts: 12 },
  ],
};

describe('AccountPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (analyticsService.getAggregatedData as jest.Mock).mockResolvedValue(mockData);
  });

  describe('Dashboard Rendering', () => {
    it('should render loading state initially', () => {
      render(<AccountPerformance />);
      expect(screen.getByText('Loading performance data...')).toBeInTheDocument();
    });

    it('should render dashboard after data loads', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(screen.getByText('Account Performance')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Unified overview of social and blockchain metrics')).toBeInTheDocument();
    });

    it('should display overview cards with correct data', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(screen.getByText('125,000')).toBeInTheDocument();
        expect(screen.getByText('$15,420.50')).toBeInTheDocument();
        expect(screen.getByText('4.8%')).toBeInTheDocument();
      });
    });

    it('should render all chart sections', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(screen.getByText('Balance History')).toBeInTheDocument();
        expect(screen.getByText('Engagement vs XLM Spent')).toBeInTheDocument();
        expect(screen.getByText('Top 5 Posts by Engagement & Value')).toBeInTheDocument();
        expect(screen.getByText('Reward Distribution Timeline')).toBeInTheDocument();
        expect(screen.getByText('Token Performance')).toBeInTheDocument();
        expect(screen.getByText('Social Platform Breakdown')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Data Visualization', () => {
    it('should render performance history chart with data', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        const chart = screen.getByText('Balance History').closest('.recharts-wrapper');
        expect(chart).toBeInTheDocument();
      });
    });

    it('should display correct number of data points', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(analyticsService.getAggregatedData).toHaveBeenCalledWith('7d');
      });
    });

    it('should render bar chart for top posts', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(screen.getByText('TikTok')).toBeInTheDocument();
        expect(screen.getByText('Instagram')).toBeInTheDocument();
      });
    });
  });

  describe('Widget Interactions', () => {
    it('should switch time range when buttons are clicked', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      });

      const thirtyDayButton = screen.getByText('Last 30 Days');
      fireEvent.click(thirtyDayButton);

      await waitFor(() => {
        expect(analyticsService.getAggregatedData).toHaveBeenCalledWith('30d');
      });
    });

    it('should expand token details when clicked', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        const xlmToken = screen.getByText('XLM');
        fireEvent.click(xlmToken.closest('div')!);
      });

      await waitFor(() => {
        expect(screen.getByText('24h Change')).toBeInTheDocument();
        expect(screen.getByText('7d Change')).toBeInTheDocument();
        expect(screen.getByText('30d Change')).toBeInTheDocument();
      });
    });

    it('should collapse token details when clicked again', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        const xlmToken = screen.getByText('XLM');
        const tokenCard = xlmToken.closest('div')!;
        
        fireEvent.click(tokenCard);
        expect(screen.getByText('24h Change')).toBeInTheDocument();
        
        fireEvent.click(tokenCard);
      });

      await waitFor(() => {
        expect(screen.queryByText('24h Change')).not.toBeInTheDocument();
      });
    });

    it('should show export dropdown on hover', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        const exportButton = screen.getByText('Export Report');
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export as PDF when PDF option is clicked', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        const pdfButton = screen.getByText('Export as PDF');
        fireEvent.click(pdfButton);
      });

      await waitFor(() => {
        expect(analyticsService.exportReport).toHaveBeenCalledWith('pdf', '7d');
      });
    });

    it('should export as CSV when CSV option is clicked', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        const csvButton = screen.getByText('Export as CSV');
        fireEvent.click(csvButton);
      });

      await waitFor(() => {
        expect(analyticsService.exportReport).toHaveBeenCalledWith('csv', '7d');
      });
    });

    it('should show loading state during export', async () => {
      (analyticsService.exportReport as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<AccountPerformance />);
      
      await waitFor(() => {
        const pdfButton = screen.getByText('Export as PDF');
        fireEvent.click(pdfButton);
      });

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should handle export errors gracefully', async () => {
      (analyticsService.exportReport as jest.Mock).mockRejectedValue(new Error('Export failed'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      render(<AccountPerformance />);
      
      await waitFor(() => {
        const pdfButton = screen.getByText('Export as PDF');
        fireEvent.click(pdfButton);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to export report. Please try again.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Data Aggregation', () => {
    it('should aggregate social metrics correctly', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(screen.getByText('50,000')).toBeInTheDocument(); // TikTok followers
        expect(screen.getByText('40,000')).toBeInTheDocument(); // Instagram followers
      });
    });

    it('should display reward distributions', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(screen.getByText('Engagement Rewards')).toBeInTheDocument();
        expect(screen.getByText('150 recipients •')).toBeInTheDocument();
        expect(screen.getByText('500.00 XLM')).toBeInTheDocument();
      });
    });

    it('should calculate wallet metrics correctly', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(screen.getByText('10,000 units')).toBeInTheDocument(); // XLM balance
        expect(screen.getByText('5,000 units')).toBeInTheDocument(); // USDC balance
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle data loading errors', async () => {
      (analyticsService.getAggregatedData as jest.Mock).mockRejectedValue(
        new Error('Failed to load data')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<AccountPerformance />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load analytics data:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should show loading state when data is null', () => {
      (analyticsService.getAggregatedData as jest.Mock).mockResolvedValue(null);
      
      render(<AccountPerformance />);
      
      expect(screen.getByText('Loading performance data...')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render grid layouts correctly', async () => {
      render(<AccountPerformance />);
      
      await waitFor(() => {
        const overviewGrid = screen.getByText('Total Follower Growth').closest('.grid');
        expect(overviewGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
      });
    });
  });
});
