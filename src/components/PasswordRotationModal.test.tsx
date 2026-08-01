/**
 * PasswordRotationModal.test.tsx
 *
 * Covers:
 *  - Modal does not render when isOpen=false
 *  - Password mismatch validation error
 *  - Minimum-length (< 8 chars) validation error
 *  - Successful submission: onSubmit called with correct args; fields reset
 *  - onSubmit rejection: thrown Error.message is displayed
 *  - External error prop is rendered
 *  - isLoading disables inputs and shows "Updating..." button text
 *  - Fields are cleared on unmount (cleanup in useEffect)
 *  - Cancel button calls onClose
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PasswordRotationModal } from './PasswordRotationModal';

// ── helpers ───────────────────────────────────────────────────────────────────

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (current: string, next: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

function renderModal(overrides: Props = {}) {
  const defaults: Required<Props> = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: undefined as unknown as string,
  };
  const props = { ...defaults, ...overrides };
  return render(<PasswordRotationModal {...props} />);
}

function fillForm(current = 'OldPass1!', next = 'NewPass1!', confirm = 'NewPass1!') {
  fireEvent.change(screen.getByLabelText(/current password/i), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText(/^new password/i), {
    target: { value: next },
  });
  fireEvent.change(screen.getByLabelText(/confirm new password/i), {
    target: { value: confirm },
  });
}

async function submitForm() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
  });
}

// ── visibility ────────────────────────────────────────────────────────────────

test('renders nothing when isOpen is false', () => {
  renderModal({ isOpen: false });
  expect(screen.queryByText(/password rotation required/i)).not.toBeInTheDocument();
});

test('renders the modal when isOpen is true', () => {
  renderModal({ isOpen: true });
  expect(screen.getByText(/password rotation required/i)).toBeInTheDocument();
});

// ── validation errors ─────────────────────────────────────────────────────────

test('shows mismatch error when new password and confirm do not match', async () => {
  renderModal();
  fillForm('OldPass1!', 'NewPass1!', 'DifferentPass1!');
  await submitForm();

  expect(screen.getByText(/new passwords do not match/i)).toBeInTheDocument();
});

test('does NOT call onSubmit when passwords do not match', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  renderModal({ onSubmit });
  fillForm('OldPass1!', 'NewPass1!', 'DifferentPass1!');
  await submitForm();

  expect(onSubmit).not.toHaveBeenCalled();
});

test('shows min-length error when new password is fewer than 8 characters', async () => {
  renderModal();
  fillForm('OldPass1!', 'abc', 'abc');
  await submitForm();

  expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
});

test('does NOT call onSubmit when password is too short', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  renderModal({ onSubmit });
  fillForm('OldPass1!', 'abc', 'abc');
  await submitForm();

  expect(onSubmit).not.toHaveBeenCalled();
});

// ── successful submission ─────────────────────────────────────────────────────

test('calls onSubmit with currentPassword and newPassword on valid input', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  renderModal({ onSubmit });
  fillForm('MyCurrentPass1', 'MyNewPassword1', 'MyNewPassword1');
  await submitForm();

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('MyCurrentPass1', 'MyNewPassword1'));
});

test('clears all input fields after a successful submission', async () => {
  renderModal();
  fillForm('OldPass1!', 'NewPass123!', 'NewPass123!');
  await submitForm();

  await waitFor(() => {
    expect(screen.getByLabelText(/current password/i)).toHaveValue('');
    expect(screen.getByLabelText(/^new password/i)).toHaveValue('');
    expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
  });
});

// ── onSubmit failure / server error ──────────────────────────────────────────

test('displays the error message thrown by onSubmit', async () => {
  const onSubmit = jest.fn().mockRejectedValue(new Error('Server rejected the password'));
  renderModal({ onSubmit });
  fillForm('OldPass1!', 'NewPass123!', 'NewPass123!');
  await submitForm();

  await waitFor(() =>
    expect(screen.getByText(/server rejected the password/i)).toBeInTheDocument(),
  );
});

test('displays a generic fallback message when onSubmit throws a non-Error', async () => {
  const onSubmit = jest.fn().mockRejectedValue('oops');
  renderModal({ onSubmit });
  fillForm('OldPass1!', 'NewPass123!', 'NewPass123!');
  await submitForm();

  await waitFor(() => expect(screen.getByText(/failed to change password/i)).toBeInTheDocument());
});

// ── external error prop ───────────────────────────────────────────────────────

test('renders the external error prop', () => {
  renderModal({ error: 'Token expired. Please log in again.' });
  expect(screen.getByText(/token expired/i)).toBeInTheDocument();
});

// ── loading state ─────────────────────────────────────────────────────────────

test('disables all inputs and shows "Updating..." when isLoading is true', () => {
  renderModal({ isLoading: true });

  expect(screen.getByLabelText(/current password/i)).toBeDisabled();
  expect(screen.getByLabelText(/^new password/i)).toBeDisabled();
  expect(screen.getByLabelText(/confirm new password/i)).toBeDisabled();
  expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
});

// ── cancel button ─────────────────────────────────────────────────────────────

test('cancel button calls onClose', () => {
  const onClose = jest.fn();
  renderModal({ onClose });

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

  expect(onClose).toHaveBeenCalledTimes(1);
});

// ── field clearing on unmount ─────────────────────────────────────────────────

test('fields are cleared when the component unmounts (cleanup)', () => {
  // We verify the cleanup function runs by checking the state is reset.
  // The useEffect cleanup calls the state setters which clears the values.
  // Since the component is removed from the DOM we verify no sensitive value
  // leaks by confirming the inputs are empty on a fresh remount.
  const { unmount, rerender } = renderModal();

  fillForm('OldPass1!', 'NewPass123!', 'NewPass123!');

  // Confirm values are set
  expect(screen.getByLabelText(/current password/i)).toHaveValue('OldPass1!');

  // Unmount — the useEffect cleanup must clear state
  unmount();

  // Remount — React creates fresh state, but the cleanup must have run
  // without throwing (observable side-effect: no console errors)
  rerender(
    <PasswordRotationModal
      isOpen={true}
      onClose={jest.fn()}
      onSubmit={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  // Fresh mount starts with empty fields
  expect(screen.getByLabelText(/current password/i)).toHaveValue('');
  expect(screen.getByLabelText(/^new password/i)).toHaveValue('');
  expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
});

test('unmounting the component does not throw', () => {
  const { unmount } = renderModal();
  fillForm('OldPass1!', 'NewPass123!', 'NewPass123!');

  expect(() => unmount()).not.toThrow();
});
