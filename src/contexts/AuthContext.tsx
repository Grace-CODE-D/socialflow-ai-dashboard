import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { AuthService } from '../api/services/AuthService';
import { ApiError } from '../api/core/ApiError';

const TOKEN_KEY = 'sf_auth_token';
const REFRESH_TOKEN_KEY = 'sf_auth_refresh_token';
const USER_KEY = 'sf_auth_user';

export interface AuthUser {
  name: string;
  email: string;
  plan: string;
  /** Real follower count sourced from the connected account's profile data, when known. */
  followerCount?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

function userFromEmail(email: string): AuthUser {
  return {
    email,
    name: email.split('@')[0].replace(/^\w/, (c) => c.toUpperCase()),
    plan: 'Pro Plan',
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    let tokens;
    try {
      tokens = await AuthService.postAuthLogin({ requestBody: { email, password } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw new Error('Invalid email or password.');
      }
      throw err;
    }

    const nextUser = userFromEmail(email);
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(tokens.accessToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: !!token, user: token ? user : null, login, logout }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
