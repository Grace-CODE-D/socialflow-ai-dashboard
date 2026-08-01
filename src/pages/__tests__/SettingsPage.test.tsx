import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SettingsPage } from '../SettingsPage';

vi.mock('../../components/TwoFactorSetup', () => ({ __esModule: true, default: () => <div /> }));
vi.mock('../../components/TranslationPanel', () => ({ TranslationPanel: () => <div /> }));
vi.mock('../../components/WebhookManager', () => ({ __esModule: true, default: () => <div /> }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Alex Morgan', email: 'alex@socialflow.ai', plan: 'Pro Plan' } }),
}));

const toastMock = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ toast: toastMock }) }));

const changePasswordMock = vi.fn();
vi.mock('../../hooks/usePasswordRotation', () => ({
  usePasswordRotation: () => ({ changePassword: changePasswordMock, isLoading: false, error: null }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function fillPasswordForm(container: HTMLElement, current: string, next: string) {
  const inputs = container.querySelectorAll('input[type="password"]');
  fireEvent.change(inputs[0], { target: { value: current } });
  fireEvent.change(inputs[1], { target: { value: next } });
  fireEvent.change(inputs[2], { target: { value: next } });
}

test('submitting the password modal calls the real usePasswordRotation hook, not a fake timeout', async () => {
  changePasswordMock.mockResolvedValue(undefined);

  const { container } = render(<SettingsPage />);

  fireEvent.click(screen.getByRole('button', { name: /Security/i }));
  fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

  fillPasswordForm(container, 'old-pass-123', 'new-pass-456');

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
  });

  await waitFor(() =>
    expect(changePasswordMock).toHaveBeenCalledWith('old-pass-123', 'new-pass-456'),
  );
  expect(toastMock).toHaveBeenCalledWith('Password updated successfully.', 'success');
});

test('a rejected changePassword call surfaces the real backend error and does not show success', async () => {
  changePasswordMock.mockRejectedValue(new Error('Current password is incorrect'));

  const { container } = render(<SettingsPage />);

  fireEvent.click(screen.getByRole('button', { name: /Security/i }));
  fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

  fillPasswordForm(container, 'wrong-pass', 'new-pass-456');

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
  });

  await waitFor(() => expect(changePasswordMock).toHaveBeenCalled());
  expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
  expect(toastMock).not.toHaveBeenCalledWith('Password updated successfully.', 'success');
});
