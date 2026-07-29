import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { PostsProvider } from '../../contexts/PostsContext';
import { ComposerProvider } from '../../contexts/ComposerContext';

const renderDashboardLayout = (initialPath = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <ToastProvider>
          <PostsProvider>
            <ComposerProvider>
              <Routes>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<div>Dashboard Child Page</div>} />
                  <Route path="/analytics" element={<div>Analytics Child Page</div>} />
                </Route>
              </Routes>
            </ComposerProvider>
          </PostsProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe('DashboardLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('verifies that child content outlet renders inside layout shell', () => {
    renderDashboardLayout('/');

    expect(screen.getByText(/SocialFlow AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome Back, Alex!/i)).toBeInTheDocument();
    expect(screen.getByText('Dashboard Child Page')).toBeInTheDocument();
  });

  test('renders route title and child content on /analytics route', () => {
    renderDashboardLayout('/analytics');

    expect(screen.getByText('Analytics Child Page')).toBeInTheDocument();
  });

  test('opens post composer when Create New Post button is clicked', () => {
    renderDashboardLayout('/');

    const createBtn = screen.getByRole('button', { name: /Create New Post/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole('dialog', { name: /Create new post/i })).toBeInTheDocument();
  });
});
