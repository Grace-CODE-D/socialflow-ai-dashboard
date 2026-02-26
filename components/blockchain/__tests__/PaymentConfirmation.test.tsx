import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentConfirmation } from '../PaymentConfirmation';
import { PaymentSummary } from '../../../types';

const mockSummary: PaymentSummary = {
  recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
  amount: '100',
  asset: {
    id: '1',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 1000,
    decimals: 6,
  },
  estimatedGasFee: '1',
  totalCost: '101',
  memo: 'Test payment',
};

describe('PaymentConfirmation', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders when isOpen is true and summary exists', () => {
    render(
      <PaymentConfirmation
        isOpen={true}
        summary={mockSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PaymentConfirmation
        isOpen={false}
        summary={mockSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays payment summary details', () => {
    render(
      <PaymentConfirmation
        isOpen={true}
        summary={mockSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('GBRPYH...F3')).toBeInTheDocument();
    expect(screen.getByText('100 USDC')).toBeInTheDocument();
    expect(screen.getByText('1 USDC')).toBeInTheDocument();
    expect(screen.getByText('101 USDC')).toBeInTheDocument();
  });

  it('displays memo when provided', () => {
    render(
      <PaymentConfirmation
        isOpen={true}
        summary={mockSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Test payment')).toBeInTheDocument();
  });

  it('shows large amount warning for amounts > 1000', () => {
    const largeSummary = { ...mockSummary, amount: '1500', totalCost: '1515' };

    render(
      <PaymentConfirmation
        isOpen={true}
        summary={largeSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Large Amount')).toBeInTheDocument();
    expect(screen.getByText(/This is a large payment/)).toBeInTheDocument();
  });

  it('requires confirmation checkbox for large amounts', async () => {
    const user = userEvent.setup();
    const largeSummary = { ...mockSummary, amount: '1500', totalCost: '1515' };

    render(
      <PaymentConfirmation
        isOpen={true}
        summary={largeSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(confirmButton).not.toBeDisabled();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaymentConfirmation
        isOpen={true}
        summary={mockSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaymentConfirmation
        isOpen={true}
        summary={mockSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(
      <PaymentConfirmation
        isOpen={true}
        summary={mockSummary}
        isLoading={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    const confirmButton = screen.getByText('Processing...');
    expect(confirmButton).toBeDisabled();
  });

  it('disables buttons during loading', async () => {
    const user = userEvent.setup();
    render(
      <PaymentConfirmation
        isOpen={true}
        summary={mockSummary}
        isLoading={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Processing...');

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it('does not show large amount warning for normal amounts', () => {
    render(
      <PaymentConfirmation
        isOpen={true}
        summary={mockSummary}
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Large Amount')).not.toBeInTheDocument();
  });
});
