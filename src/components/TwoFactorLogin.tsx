import React, { useState, useEffect } from 'react';
import { twoFactorService, TwoFactorUnavailableError } from '../services/twoFactorService';

interface TwoFactorLoginProps {
  onSuccess: () => void;
}

type Mode = 'totp' | 'recovery';

const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<Mode>('totp');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);

  // Countdown timer for lockout
  useEffect(() => {
    const checkLockout = async () => {
      const locked = await twoFactorService.isLockedOut();
      setLockedOut(locked);
      if (!locked) return;
      
      const interval = setInterval(async () => {
        const ms = await twoFactorService.getLockoutRemainingMs();
        setRemainingMs(ms);
        if (ms <= 0) {
          clearInterval(interval);
          setLockedOut(false);
        }
      }, 1000);
      
      const ms = await twoFactorService.getLockoutRemainingMs();
      setRemainingMs(ms);
      
      return () => clearInterval(interval);
    };
    
    checkLockout();
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (await twoFactorService.isLockedOut()) {
      setRemainingMs(await twoFactorService.getLockoutRemainingMs());
      setLockedOut(true);
      return;
    }

    setLoading(true);
    try {
      let valid = false;

      if (mode === 'totp') {
        valid = await twoFactorService.verifyStoredToken(input);
      } else {
        valid = await twoFactorService.verifyRecoveryCode(input);
        if (!valid) {
          const remaining = await twoFactorService.getRemainingRecoveryCodeCount();
          if (remaining === 0) {
            setError('All recovery codes used — disable and re-enable 2FA to generate new ones.');
            return;
          }
        }
      }

      if (valid) {
        twoFactorService.resetFailedAttempts();
        onSuccess();
      } else {
        twoFactorService.recordFailedAttempt();
        if (await twoFactorService.isLockedOut()) {
          const ms = await twoFactorService.getLockoutRemainingMs();
          setRemainingMs(ms);
          setLockedOut(true);
          setError(`Too many failed attempts. Try again in ${Math.ceil(ms / 60000)} minute(s).`);
        } else {
          setError('Invalid code. Please try again.');
        }
      }
    } catch (e) {
      setError(e instanceof TwoFactorUnavailableError ? e.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'totp' ? 'recovery' : 'totp');
    setInput('');
    setError(null);
  };

  const lockoutSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-2">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'totp'
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter one of your recovery codes.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type={mode === 'totp' ? 'text' : 'text'}
            inputMode={mode === 'totp' ? 'numeric' : 'text'}
            maxLength={mode === 'totp' ? 6 : 10}
            placeholder={mode === 'totp' ? '6-digit code' : 'Recovery code'}
            value={input}
            onChange={e => setInput(mode === 'totp' ? e.target.value.replace(/\D/g, '') : e.target.value)}
            disabled={lockedOut || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />

          {lockedOut && (
            <p className="text-red-600 text-sm">
              Input locked. Try again in {lockoutSeconds}s.
            </p>
          )}

          {error && !lockedOut && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={lockedOut || loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <button
          onClick={switchMode}
          className="mt-4 w-full text-sm text-blue-600 hover:underline"
        >
          {mode === 'totp' ? 'Use a recovery code' : 'Use authenticator app'}
        </button>
      </div>
    </div>
  );
};

export default TwoFactorLogin;
