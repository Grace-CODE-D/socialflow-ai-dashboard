import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeveloperTools } from '../../components/DeveloperTools';
import { stellarService } from '../blockchain/services/StellarService';

vi.mock('../blockchain/services/StellarService', () => ({
  stellarService: {
    getNetworkStatus: vi.fn(),
    getNetwork: vi.fn(),
    getBalances: vi.fn(),
    getServer: vi.fn()
  }
}));

global.fetch = vi.fn() as any;
global.alert = vi.fn();

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn()
  }
});

describe('DeveloperTools', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (stellarService.getNetworkStatus as any).mockResolvedValue(true);
    (stellarService.getNetwork as any).mockReturnValue({
      networkPassphrase: 'Test SDF Network',
      horizonUrl: 'https://horizon-testnet.stellar.org'
    });
  });

  it('renders developer tools dashboard', () => {
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Developer Tools')).toBeTruthy();
    expect(screen.getByText('Network Status')).toBeTruthy();
  });

  it('displays network status on mount', async () => {
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeTruthy();
      expect(screen.getByText('Testnet')).toBeTruthy();
    });
  });

  it('shows disconnected status on network error', async () => {
    (stellarService.getNetworkStatus as any).mockRejectedValue(new Error('Network error'));
    
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeTruthy();
    });
  });

  it('loads account data when button clicked', async () => {
    const mockBalances = [
      { asset: 'XLM', issuer: 'native', balance: 100.5 }
    ];
    
    const mockServer = {
      transactions: vi.fn().mockReturnValue({
        forAccount: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              call: vi.fn().mockResolvedValue({
                records: [
                  {
                    id: 'tx123',
                    created_at: '2026-02-26T00:00:00Z',
                    source_account: 'GTEST',
                    memo_type: 'text',
                    successful: true
                  }
                ]
              })
            })
          })
        })
      })
    };

    (stellarService.getBalances as any).mockResolvedValue(mockBalances);
    (stellarService as any).getServer = vi.fn().mockReturnValue(mockServer);

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Account Balances')).toBeTruthy();
      expect(screen.getByText('XLM')).toBeTruthy();
      expect(screen.getByText('100.5000000')).toBeTruthy();
    });
  });

  it('shows error when loading account fails', async () => {
    (stellarService.getBalances as jest.Mock).mockRejectedValue(new Error('Account not found'));

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'INVALID' } });
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Account not found')).toBeTruthy();
    });
  });

  it('funds test account via friendbot', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    
    const mockBalances = [{ asset: 'XLM', issuer: 'native', balance: 10000 }];
    (stellarService.getBalances as jest.Mock).mockResolvedValue(mockBalances);
    
    const mockServer = {
      transactions: vi.fn().mockReturnValue({
        forAccount: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              call: vi.fn().mockResolvedValue({ records: [] })
            })
          })
        })
      })
    };
    (stellarService as any).getServer = vi.fn().mockReturnValue(mockServer);

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const fundButton = screen.getByText('Fund via Friendbot');
    fireEvent.click(fundButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://friendbot.stellar.org?addr=GTEST123'
      );
      expect(global.alert).toHaveBeenCalledWith('Test account funded successfully!');
    });
  });

  it('shows error when friendbot fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const fundButton = screen.getByText('Fund via Friendbot');
    fireEvent.click(fundButton);

    await waitFor(() => {
      expect(screen.getByText('Friendbot request failed')).toBeTruthy();
    });
  });

  it('copies address to clipboard', async () => {
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const copyButton = screen.getByText('Copy Address');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('GTEST123');
    expect(global.alert).toHaveBeenCalledWith('Copied to clipboard!');
  });

  it('refreshes network status', async () => {
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(stellarService.getNetworkStatus).toHaveBeenCalledTimes(2);
    });
  });

  it('displays recent transactions', async () => {
    const mockServer = {
      transactions: vi.fn().mockReturnValue({
        forAccount: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              call: vi.fn().mockResolvedValue({
                records: [
                  {
                    id: 'tx123abc',
                    created_at: '2026-02-26T00:00:00Z',
                    source_account: 'GTEST',
                    memo_type: 'text',
                    successful: true
                  }
                ]
              })
            })
          })
        })
      })
    };

    (stellarService.getBalances as jest.Mock).mockResolvedValue([]);
    (stellarService as any).getServer = vi.fn().mockReturnValue(mockServer);

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Recent Transactions')).toBeTruthy();
      expect(screen.getByText('Success')).toBeTruthy();
      expect(screen.getByText('tx123abc')).toBeTruthy();
    });
  });

  it('shows error when no account address provided', async () => {
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a test account address')).toBeTruthy();
    });
  });

  it('disables buttons when loading', async () => {
    (stellarService.getBalances as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    expect(loadButton).toHaveProperty('disabled', true);
    expect(screen.getByText('Fund via Friendbot')).toHaveProperty('disabled', true);
  });
});
