import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsPage } from './SettingsPage';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

const renderSettingsPage = () => {
  return render(
    <AuthProvider>
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>
    </AuthProvider>,
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('covers tab switching between profile, security, integrations, and localization', () => {
    renderSettingsPage();

    // Default tab: Profile
    expect(screen.getByText(/Display name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();

    // Switch to Security tab
    const securityTabBtn = screen.getByRole('button', { name: /Security/i });
    fireEvent.click(securityTabBtn);
    expect(screen.getAllByText(/Two-Factor Authentication/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();

    // Switch to Integrations tab
    const integrationsTabBtn = screen.getByRole('button', { name: /Integrations/i });
    fireEvent.click(integrationsTabBtn);
    expect(screen.getAllByText(/Webhook/i).length).toBeGreaterThan(0);

    // Switch to Localization tab
    const localizationTabBtn = screen.getByRole('button', { name: /Localization/i });
    fireEvent.click(localizationTabBtn);
    expect(screen.getByText(/Multi-Language Translation/i)).toBeInTheDocument();
  });

  test('covers password modal open and close wiring', () => {
    renderSettingsPage();

    // Switch to Security tab
    const securityTabBtn = screen.getByRole('button', { name: /Security/i });
    fireEvent.click(securityTabBtn);

    // Modal initially closed
    expect(screen.queryByText('Password Rotation Required')).not.toBeInTheDocument();

    // Open modal
    const changePasswordBtn = screen.getByRole('button', { name: /Change Password/i });
    fireEvent.click(changePasswordBtn);

    const modalTitle = screen.getByText('Password Rotation Required');
    expect(modalTitle).toBeInTheDocument();

    const modalContainer = modalTitle.closest('div')!.parentElement!;
    const cancelBtn = within(modalContainer).getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Password Rotation Required')).not.toBeInTheDocument();
  });
});
