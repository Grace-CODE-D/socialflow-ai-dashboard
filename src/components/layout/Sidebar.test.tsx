import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

const renderSidebar = (initialPath = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="*" element={<Sidebar />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('covers active-route highlighting for root path', () => {
    renderSidebar('/');

    const dashboardBtn = screen.getByRole('button', { name: /Dashboard/i });
    expect(dashboardBtn).toHaveAttribute('aria-current', 'page');
    expect(dashboardBtn).toHaveClass('bg-primary-rose/15');

    const analyticsBtn = screen.getByRole('button', { name: /Analytics/i });
    expect(analyticsBtn).not.toHaveAttribute('aria-current');
  });

  test('covers active-route highlighting when on /analytics route', () => {
    renderSidebar('/analytics');

    const analyticsBtn = screen.getByRole('button', { name: /Analytics/i });
    expect(analyticsBtn).toHaveAttribute('aria-current', 'page');
    expect(analyticsBtn).toHaveClass('bg-primary-rose/15');

    const dashboardBtn = screen.getByRole('button', { name: /Dashboard/i });
    expect(dashboardBtn).not.toHaveAttribute('aria-current');
  });

  test('handles sign out button click', () => {
    renderSidebar('/');

    const signOutBtn = screen.getByRole('button', { name: /Sign out/i });
    fireEvent.click(signOutBtn);

    expect(screen.getByText(/You have been signed out/i)).toBeInTheDocument();
  });
});
