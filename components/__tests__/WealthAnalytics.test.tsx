import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WealthAnalytics } from '../WealthAnalytics';

describe('WealthAnalytics', () => {
  const mockOnNavigate = vi.fn();

  it('renders wealth analytics dashboard', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Audience Wealth Analytics')).toBeInTheDocument();
  });

  it('displays key metrics cards', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Active Wallets')).toBeInTheDocument();
    expect(screen.getByText('Average Wallet Value')).toBeInTheDocument();
    expect(screen.getByText('Whale Holders')).toBeInTheDocument();
  });

  it('renders wealth distribution segments', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    expect(screen.getByText(/Whales/)).toBeInTheDocument();
    expect(screen.getByText(/Dolphins/)).toBeInTheDocument();
    expect(screen.getByText(/Fish/)).toBeInTheDocument();
    expect(screen.getByText(/Shrimp/)).toBeInTheDocument();
  });

  it('allows time range selection', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    const button1M = screen.getByText('1M');
    const button6M = screen.getByText('6M');
    
    expect(button6M).toHaveClass('bg-primary-blue');
    fireEvent.click(button1M);
    expect(button1M).toHaveClass('bg-primary-blue');
  });

  it('displays wealth heatmap', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Wealth Concentration Heatmap')).toBeInTheDocument();
  });

  it('shows top wallet analysis', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Top Wallet Analysis')).toBeInTheDocument();
  });

  it('renders token accumulation scatter chart', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Token Accumulation Patterns')).toBeInTheDocument();
  });

  it('displays wealth migration trends', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Wealth Migration & Predictive Model')).toBeInTheDocument();
    expect(screen.getByText(/Inflow/)).toBeInTheDocument();
    expect(screen.getByText(/Outflow/)).toBeInTheDocument();
  });

  it('shows AI predictive insights', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    expect(screen.getByText('AI Predictive Insights')).toBeInTheDocument();
  });

  it('allows segment selection', () => {
    render(<WealthAnalytics onNavigate={mockOnNavigate} />);
    const whaleSegment = screen.getByText(/Whales/).closest('div');
    
    fireEvent.click(whaleSegment!);
    expect(whaleSegment).toHaveClass('ring-2');
  });
});
