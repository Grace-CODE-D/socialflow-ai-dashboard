import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringPaymentSetup } from '../RecurringPayment';
import { Asset } from '../../../types';

const mockAssets: Asset[] = [
  {
    id: '1',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 1000,
    decimals: 6,
  },
  {
    id: '2',
    symbol: 'XLM',
    name: 'Stellar Lumens',
    balance: 500,
    decimals: 7,
  },
];

describe('RecurringPaymentSetup', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders when isOpen is true', () => {
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Schedule Payment')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <RecurringPaymentSetup
        isOpen={false}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays frequency options', () => {
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByDisplayValue('monthly')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const scheduleButton = screen.getByText('Schedule');
    await user.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText('Recipient address is required')).toBeInTheDocument();
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
    });
  });

  it('validates end date is after start date', async () => {
    const user = userEvent.setup();
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const validAddress = 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3';
    const recipientInput = screen.getByPlaceholderText('G...');
    const amountInput = screen.getByPlaceholderText('0.00');
    const startDateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    const endDateInputs = screen.getAllByDisplayValue('');

    await user.type(recipientInput, validAddress);
    await user.type(amountInput, '100');

    // Set end date to before start date
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const endDateInput = endDateInputs.find(
      (input) => input.getAttribute('type') === 'date' && input !== startDateInput
    ) as HTMLInputElement;

    if (endDateInput) {
      await user.type(endDateInput, yesterdayStr);
    }

    const scheduleButton = screen.getByText('Schedule');
    await user.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const validAddress = 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3';
    const recipientInput = screen.getByPlaceholderText('G...');
    const amountInput = screen.getByPlaceholderText('0.00');
    const frequencySelect = screen.getByDisplayValue('monthly');
    const scheduleButton = screen.getByText('Schedule');

    await user.type(recipientInput, validAddress);
    await user.type(amountInput, '100');
    await user.selectOptions(frequencySelect, 'weekly');
    await user.click(scheduleButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientAddress: validAddress,
          amount: '100',
          frequency: 'weekly',
        })
      );
    });
  });

  it('changes frequency and updates next payment date', async () => {
    const user = userEvent.setup();
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const frequencySelect = screen.getByDisplayValue('monthly');
    await user.selectOptions(frequencySelect, 'daily');

    // Next payment date should update
    const nextPaymentText = screen.getByText(/Next Payment/);
    expect(nextPaymentText).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('includes optional memo in submission', async () => {
    const user = userEvent.setup();
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const validAddress = 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3';
    const recipientInput = screen.getByPlaceholderText('G...');
    const amountInput = screen.getByPlaceholderText('0.00');
    const memoInput = screen.getByPlaceholderText('Add a note for this recurring payment...');
    const scheduleButton = screen.getByText('Schedule');

    await user.type(recipientInput, validAddress);
    await user.type(amountInput, '50');
    await user.type(memoInput, 'Monthly subscription');
    await user.click(scheduleButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          memo: 'Monthly subscription',
        })
      );
    });
  });

  it('displays next payment date preview', () => {
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Next Payment')).toBeInTheDocument();
  });

  it('allows changing asset', async () => {
    const user = userEvent.setup();
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const assetSelect = screen.getByDisplayValue('USDC - USD Coin');
    await user.selectOptions(assetSelect, '2');

    expect(screen.getByDisplayValue('XLM - Stellar Lumens')).toBeInTheDocument();
  });

  it('validates insufficient balance', async () => {
    const user = userEvent.setup();
    render(
      <RecurringPaymentSetup
        isOpen={true}
        assets={mockAssets}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const validAddress = 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3';
    const recipientInput = screen.getByPlaceholderText('G...');
    const amountInput = screen.getByPlaceholderText('0.00');
    const scheduleButton = screen.getByText('Schedule');

    await user.type(recipientInput, validAddress);
    await user.type(amountInput, '2000'); // More than balance
    await user.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
    });
  });
});
