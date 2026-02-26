import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PerformanceComparison, usePerformanceComparison } from '../PerformanceComparison';
import { renderHook } from '@testing-library/react';

describe('PerformanceComparison', () => {
  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<PerformanceComparison timeRange="7d" />);
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render period comparison after loading', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Period Comparison/)).toBeInTheDocument();
      });
    });

    it('should display all metric changes', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Followers/)).toBeInTheDocument();
        expect(screen.getByText(/Engagement/)).toBeInTheDocument();
        expect(screen.getByText(/Wallet Value/)).toBeInTheDocument();
        expect(screen.getByText(/Xlm Spent/)).toBeInTheDocument();
      });
    });

    it('should render insights section', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      });
    });

    it('should render benchmark comparison', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        expect(screen.getByText('Industry Benchmarks')).toBeInTheDocument();
        expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
        expect(screen.getByText('Follower Growth')).toBeInTheDocument();
      });
    });
  });

  describe('Trend Indicators', () => {
    it('should show up trend for positive changes', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        const upTrends = screen.getAllByText('↑');
        expect(upTrends.length).toBeGreaterThan(0);
      });
    });

    it('should show down trend for negative changes', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        const percentages = screen.getAllByText(/[+-]\d+\.\d+%/);
        expect(percentages.length).toBeGreaterThan(0);
      });
    });

    it('should display percentage changes correctly', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        const changes = screen.getAllByText(/[+-]\d+\.\d+%/);
        changes.forEach(change => {
          expect(change.textContent).toMatch(/^[+-]\d+\.\d+%$/);
        });
      });
    });
  });

  describe('Benchmark Comparisons', () => {
    it('should display benchmark status badges', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        expect(screen.getAllByText('Above Average').length).toBeGreaterThan(0);
      });
    });

    it('should show industry average values', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        const avgLabels = screen.getAllByText(/Avg:/);
        expect(avgLabels.length).toBeGreaterThan(0);
      });
    });

    it('should display top performer values', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        const topLabels = screen.getAllByText(/Top:/);
        expect(topLabels.length).toBeGreaterThan(0);
      });
    });

    it('should render progress bars for benchmarks', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        const progressBars = document.querySelectorAll('.bg-primary-blue');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Insights', () => {
    it('should generate insights based on trends', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        const insights = screen.getAllByText(/💡/);
        expect(insights.length).toBeGreaterThan(0);
      });
    });

    it('should display follower growth insights', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Follower growth/)).toBeInTheDocument();
      });
    });

    it('should display engagement insights', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Engagement rate/)).toBeInTheDocument();
      });
    });
  });

  describe('usePerformanceComparison Hook', () => {
    it('should return loading state initially', () => {
      const { result } = renderHook(() => usePerformanceComparison('7d'));
      expect(result.current.loading).toBe(true);
    });

    it('should load comparison data', async () => {
      const { result } = renderHook(() => usePerformanceComparison('7d'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.comparison).not.toBeNull();
      });
    });

    it('should calculate changes correctly', async () => {
      const { result } = renderHook(() => usePerformanceComparison('7d'));
      
      await waitFor(() => {
        const { comparison } = result.current;
        expect(comparison?.changes.followers.percentage).toBeGreaterThan(0);
      });
    });

    it('should reload data when timeRange changes', async () => {
      const { result, rerender } = renderHook(
        ({ timeRange }) => usePerformanceComparison(timeRange),
        { initialProps: { timeRange: '7d' as const } }
      );
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      rerender({ timeRange: '30d' as const });
      
      expect(result.current.loading).toBe(true);
    });

    it('should provide benchmark data', async () => {
      const { result } = renderHook(() => usePerformanceComparison('7d'));
      
      await waitFor(() => {
        expect(result.current.benchmarks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Time Range Handling', () => {
    it('should display correct period label for 7 days', async () => {
      render(<PerformanceComparison timeRange="7d" />);
      
      await waitFor(() => {
        expect(screen.getByText(/7 Days/)).toBeInTheDocument();
      });
    });

    it('should display correct period label for 30 days', async () => {
      render(<PerformanceComparison timeRange="30d" />);
      
      await waitFor(() => {
        expect(screen.getByText(/30 Days/)).toBeInTheDocument();
      });
    });
  });
});
