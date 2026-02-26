import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentRequest } from '../PaymentRequest';
import { PaymentRequest as PaymentRequestType } from '../../../types';

const mockPaymentRequest: PaymentRequestType = {
  id: 'pr-123',
  recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
  amount: '100',
  asset: {
    id: '1',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 1000,
    decimals: 6,
  },
  memo: 'Payment for services',
  qrCode: 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E',
  shareableLink: 'https://example.com?payment=test',
  createdAt: new Date(),
};

describe('PaymentRequest', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when isOpen is true and paymentRequest exists', () => {
    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Payment Request')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PaymentRequest
        isOpen={false}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays QR code', () => {
    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    const qrImage = screen.getByAltText('Payment QR Code');
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute('src', mockPaymentRequest.qrCode);
  });

  it('displays payment request details', () => {
    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('100 USDC')).toBeInTheDocument();
    expect(screen.getByText('GBRPYH...F3')).toBeInTheDocument();
    expect(screen.getByText('Payment for services')).toBeInTheDocument();
  });

  it('copies recipient address to clipboard', async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');

    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    const copyButtons = screen.getAllByTitle('Copy address');
    await user.click(copyButtons[0]);

    expect(clipboardSpy).toHaveBeenCalledWith(mockPaymentRequest.recipientAddress);
    clipboardSpy.mockRestore();
  });

  it('copies shareable link to clipboard', async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');

    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    const copyButtons = screen.getAllByTitle('Copy link');
    await user.click(copyButtons[0]);

    expect(clipboardSpy).toHaveBeenCalledWith(mockPaymentRequest.shareableLink);
    clipboardSpy.mockRestore();
  });

  it('shows success indicator after copying', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    const copyButtons = screen.getAllByTitle('Copy link');
    await user.click(copyButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('check')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays shareable link in input field', () => {
    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    const linkInput = screen.getByDisplayValue(mockPaymentRequest.shareableLink);
    expect(linkInput).toBeInTheDocument();
    expect(linkInput).toHaveAttribute('readonly');
  });

  it('shares payment request when share button is clicked', async () => {
    const user = userEvent.setup();
    const shareSpy = vi.fn();
    Object.defineProperty(navigator, 'share', {
      value: shareSpy,
      writable: true,
    });

    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={mockPaymentRequest}
        onClose={mockOnClose}
      />
    );

    const shareButton = screen.getByText('Share');
    await user.click(shareButton);

    expect(shareSpy).toHaveBeenCalledWith({
      title: 'Payment Request',
      text: expect.stringContaining('100 USDC'),
      url: mockPaymentRequest.shareableLink,
    });
  });

  it('does not display memo when not provided', () => {
    const requestWithoutMemo = { ...mockPaymentRequest, memo: undefined };

    render(
      <PaymentRequest
        isOpen={true}
        paymentRequest={requestWithoutMemo}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Memo')).not.toBeInTheDocument();
  });
});
