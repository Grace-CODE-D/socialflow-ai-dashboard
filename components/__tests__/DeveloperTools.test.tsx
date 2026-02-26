import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeveloperTools } from '../DeveloperTools';
import { stellarService } from '../../src/blockchain/services/StellarService';

jest.mock('../../src/blockchain/services/StellarService', () => ({
  stellarService: {
    getNetworkStatus: jest.fn(),
    getNetwork: jest.fn(),
    getBalances: jest.fn(),
    getServer: jest.fn()
  }
}));

global.fetch = jest.fn();
global.alert = jest.fn();

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
});

describe('DeveloperTools', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (stellarService.getNetworkStatus as jest.Mock).mockResolvedValue(true);
    (stellarService.getNetwork as jest.Mock).mockReturnValue({
      networkPassphrase: 'Test SDF Network',
      horizonUrl: 'https://horizon-testnet.stellar.org'
    });
  });

  it('renders developer tools dashboard', () => {
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Developer Tools')).toBeInTheDocument();
    expect(screen.getByText('Network Status')).toBeInTheDocument();
  });

  it('displays network status on mount', async () => {
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Testnet')).toBeInTheDocument();
    });
  });

  it('shows disconnected status on network error', async () => {
    (stellarService.getNetworkStatus as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  it('loads account data when button clicked', async () => {
    const mockBalances = [
      { asset: 'XLM', issuer: 'native', balance: 100.5 }
    ];
    
    const mockServer = {
      transactions: jest.fn().mockReturnValue({
        forAccount: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              call: jest.fn().mockResolvedValue({
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

    (stellarService.getBalances as jest.Mock).mockResolvedValue(mockBalances);
    (stellarService as any).getServer = jest.fn().mockReturnValue(mockServer);

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Account Balances')).toBeInTheDocument();
      expect(screen.getByText('XLM')).toBeInTheDocument();
      expect(screen.getByText('100.5000000')).toBeInTheDocument();
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
      expect(screen.getByText('Account not found')).toBeInTheDocument();
    });
  });

  it('funds test account via friendbot', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    
    const mockBalances = [{ asset: 'XLM', issuer: 'native', balance: 10000 }];
    (stellarService.getBalances as jest.Mock).mockResolvedValue(mockBalances);
    
    const mockServer = {
      transactions: jest.fn().mockReturnValue({
        forAccount: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              call: jest.fn().mockResolvedValue({ records: [] })
            })
          })
        })
      })
    };
    (stellarService as any).getServer = jest.fn().mockReturnValue(mockServer);

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
      expect(screen.getByText('Friendbot request failed')).toBeInTheDocument();
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
      transactions: jest.fn().mockReturnValue({
        forAccount: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              call: jest.fn().mockResolvedValue({
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
    (stellarService as any).getServer = jest.fn().mockReturnValue(mockServer);

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('tx123abc')).toBeInTheDocument();
    });
  });

  it('shows error when no account address provided', async () => {
    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a test account address')).toBeInTheDocument();
    });
  });

  it('disables buttons when loading', async () => {
    (stellarService.getBalances as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<DeveloperTools onNavigate={mockOnNavigate} />);
    
    const input = screen.getByPlaceholderText(/Enter Stellar test account/i);
    fireEvent.change(input, { target: { value: 'GTEST123' } });
    
    const loadButton = screen.getByText('Load Data');
    fireEvent.click(loadButton);

    expect(loadButton).toBeDisabled();
    expect(screen.getByText('Fund via Friendbot')).toBeDisabled();
  });
});
