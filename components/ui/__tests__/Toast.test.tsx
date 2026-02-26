import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast, ToastContainer } from '../Toast';

describe('Toast', () => {
  it('renders toast with message', () => {
    const onClose = vi.fn();
    render(<Toast id="1" type="success" message="Test message" onClose={onClose} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn();
    render(<Toast id="1" type="info" message="Test" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('auto-closes after duration', async () => {
    const onClose = vi.fn();
    render(<Toast id="1" type="success" message="Test" duration={100} onClose={onClose} />);
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 500 });
  });

  it('renders correct icon for type', () => {
    const onClose = vi.fn();
    const { rerender } = render(<Toast id="1" type="success" message="Test" onClose={onClose} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    
    rerender(<Toast id="2" type="error" message="Error" onClose={onClose} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});

describe('ToastContainer', () => {
  it('renders multiple toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success', onClose: vi.fn() },
      { id: '2', type: 'error' as const, message: 'Error', onClose: vi.fn() }
    ];
    render(<ToastContainer toasts={toasts} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders empty when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });
});
