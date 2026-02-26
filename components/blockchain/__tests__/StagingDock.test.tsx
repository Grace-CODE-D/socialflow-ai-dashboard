import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StagingDock } from '../StagingDock';
import { useStagingDock } from '../../../hooks/useStagingDock';
import { TransactionStatus, TransactionType } from '../../../types';

vi.mock('../../../hooks/useStagingDock');

describe('StagingDock', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      type: TransactionType.PAYMENT,
      status: TransactionStatus.PENDING,
      description: 'Payment to Alice',
      amount: '100',
      asset: 'XLM',
      timestamp: Date.now(),
      requiresSignature: false
    },
    {
      id: 'tx-2',
      type: TransactionType.TOKEN_MINT,
      status: TransactionStatus.SIGNING,
      description: 'Mint tokens',
      timestamp: Date.now(),
      requiresSignature: true
    }
  ];

  const mockHook = {
    transactions: mockTransactions,
    toasts: [],
    removeTransaction: vi.fn(),
    clearCompleted: vi.fn(),
    setNotificationPreferences: vi.fn(),
    getNotificationPreferences: vi.fn(() => ({
      enabled: true,
      sound: true,
      soundType: 'default',
      grouping: true,
      showOnNewItem: true,
      showOnSignature: true,
      showOnConfirmation: true
    }))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useStagingDock as any).mockReturnValue(mockHook);
  });

  it('renders transaction queue with correct count', () => {
    render(<StagingDock />);
    expect(screen.getByText('Transaction Queue')).toBeInTheDocument();
    expect(screen.getByText('2 pending')).toBeInTheDocument();
  });

  it('displays all transactions', () => {
    render(<StagingDock />);
    expect(screen.getByText('Payment to Alice')).toBeInTheDocument();
    expect(screen.getByText('Mint tokens')).toBeInTheDocument();
  });

  it('removes transaction when X button clicked', () => {
    render(<StagingDock />);
    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[2]);
    expect(mockHook.removeTransaction).toHaveBeenCalledWith('tx-1');
  });

  it('clears completed transactions', () => {
    render(<StagingDock />);
    const trashButton = screen.getByRole('button', { name: '' });
    fireEvent.click(trashButton);
    expect(mockHook.clearCompleted).toHaveBeenCalled();
  });

  it('toggles settings panel', () => {
    render(<StagingDock />);
    const settingsButton = screen.getAllByRole('button')[0];
    fireEvent.click(settingsButton);
    expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
  });

  it('updates notification preferences', () => {
    render(<StagingDock />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const soundCheckbox = screen.getByLabelText('Sound');
    fireEvent.click(soundCheckbox);
    expect(mockHook.setNotificationPreferences).toHaveBeenCalled();
  });

  it('shows empty state when no transactions', () => {
    (useStagingDock as any).mockReturnValue({ ...mockHook, transactions: [] });
    render(<StagingDock />);
    expect(screen.getByText('No transactions in queue')).toBeInTheDocument();
  });

  it('displays signature button for signing transactions', () => {
    render(<StagingDock />);
    expect(screen.getByText('Sign Transaction')).toBeInTheDocument();
  });
});
