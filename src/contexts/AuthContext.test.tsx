import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';

type AuthCtx = ReturnType<typeof useAuth>;

const TOKEN_KEY = 'sf_auth_token';
const USER_KEY = 'sf_auth_user';

beforeEach(() => {
  window.localStorage.clear();
});

const Consumer: React.FC<{ onReady: (ctx: AuthCtx) => void }> = ({ onReady }) => {
  const ctx = useAuth();
  onReady(ctx);
  return null;
};

const renderAuth = () => {
  let ctx!: AuthCtx;
  render(
    <AuthProvider>
      <Consumer
        onReady={(c) => {
          ctx = c;
        }}
      />
    </AuthProvider>,
  );
  return () => ctx;
};

describe('AuthContext', () => {
  test('returns isAuthenticated=false and the DEFAULT_USER before any login', () => {
    const getCtx = renderAuth();

    expect(getCtx().isAuthenticated).toBe(false);
    expect(getCtx().user).toEqual({
      name: 'Alex Morgan',
      email: 'alex@socialflow.ai',
      plan: 'Pro Plan',
    });
  });

  test('login persists token and user to localStorage and updates context', () => {
    const getCtx = renderAuth();

    act(() => {
      getCtx().login('jamie@example.com');
    });

    expect(getCtx().isAuthenticated).toBe(true);
    expect(getCtx().user).toMatchObject({ email: 'jamie@example.com', name: 'Jamie' });
    expect(window.localStorage.getItem(TOKEN_KEY)).toMatch(/^demo-/);
    expect(JSON.parse(window.localStorage.getItem(USER_KEY) as string)).toEqual(getCtx().user);
  });

  test('logout clears token and user from localStorage', () => {
    const getCtx = renderAuth();

    act(() => {
      getCtx().login('jamie@example.com');
    });
    act(() => {
      getCtx().logout();
    });

    expect(getCtx().isAuthenticated).toBe(false);
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.localStorage.getItem(USER_KEY)).toBeNull();
  });

  test('useAuth throws when used outside an AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const BadConsumer: React.FC = () => {
      useAuth();
      return null;
    };

    expect(() => render(<BadConsumer />)).toThrow('useAuth must be used within an AuthProvider');

    spy.mockRestore();
  });
});
