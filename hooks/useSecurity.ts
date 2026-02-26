import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import { authService, SensitiveOperation } from '../services/authService';
import { encryptionService } from '../services/encryptionService';

export interface SecurityHookReturn {
    // Session
    isSessionActive: boolean;
    sessionRemainingTime: number;
    startSession: () => void;
    endSession: () => void;
    refreshSession: () => void;

    // Authentication
    isAuthenticated: boolean;
    requiresAuth: (operation: SensitiveOperation, amount?: number) => boolean;
    authenticateWithWallet: (
        operation: SensitiveOperation,
        signMessage: (message: string) => Promise<string>
    ) => Promise<{ success: boolean; error?: string }>;
    authenticateWithBiometrics: (
        operation: SensitiveOperation
    ) => Promise<{ success: boolean; error?: string }>;
    clearAuth: () => void;

    // Encryption
    isEncryptionReady: boolean;
    initializeEncryption: (walletSignature: string) => Promise<void>;
    encryptData: (data: string) => Promise<string>;
    decryptData: (encryptedData: string) => Promise<string>;
    setSecureItem: (key: string, value: any) => Promise<void>;
    getSecureItem: <T>(key: string) => Promise<T | null>;

    // Callbacks
    onSessionTimeout: (callback: () => void) => void;
    onSessionWarning: (callback: (remainingTime: number) => void) => void;
}

export function useSecurity(): SecurityHookReturn {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionRemainingTime, setSessionRemainingTime] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isEncryptionReady, setIsEncryptionReady] = useState(false);

    // Update session state
    useEffect(() => {
        const updateSessionState = () => {
            const state = sessionService.getSessionState();
            setIsSessionActive(state.isActive);
            setSessionRemainingTime(sessionService.getRemainingTime());
        };

        updateSessionState();
        const interval = setInterval(updateSessionState, 1000);

        return () => clearInterval(interval);
    }, []);

    // Update auth state
    useEffect(() => {
        const updateAuthState = () => {
            setIsAuthenticated(authService.isAuthenticated());
        };

        updateAuthState();
        const interval = setInterval(updateAuthState, 5000);

        return () => clearInterval(interval);
    }, []);

    // Update encryption state
    useEffect(() => {
        setIsEncryptionReady(encryptionService.isReady());
    }, []);

    // Session methods
    const startSession = useCallback(() => {
        sessionService.startSession();
        setIsSessionActive(true);
    }, []);

    const endSession = useCallback(() => {
        sessionService.endSession();
        setIsSessionActive(false);
    }, []);

    const refreshSession = useCallback(() => {
        sessionService.refreshSession();
    }, []);

    // Authentication methods
    const requiresAuth = useCallback(
        (operation: SensitiveOperation, amount?: number): boolean => {
            return authService.requiresAuth(operation, amount);
        },
        []
    );

    const authenticateWithWallet = useCallback(
        async (
            operation: SensitiveOperation,
            signMessage: (message: string) => Promise<string>
        ) => {
            const result = await authService.authenticateWithWallet(operation, signMessage);
            if (result.success) {
                setIsAuthenticated(true);
            }
            return result;
        },
        []
    );

    const authenticateWithBiometrics = useCallback(
        async (operation: SensitiveOperation) => {
            const result = await authService.authenticateWithBiometrics(operation);
            if (result.success) {
                setIsAuthenticated(true);
            }
            return result;
        },
        []
    );

    const clearAuth = useCallback(() => {
        authService.clearAuth();
        setIsAuthenticated(false);
    }, []);

    // Encryption methods
    const initializeEncryption = useCallback(async (walletSignature: string) => {
        await encryptionService.initialize(walletSignature);
        setIsEncryptionReady(true);
    }, []);

    const encryptData = useCallback(async (data: string) => {
        return await encryptionService.encrypt(data);
    }, []);

    const decryptData = useCallback(async (encryptedData: string) => {
        return await encryptionService.decrypt(encryptedData);
    }, []);

    const setSecureItem = useCallback(async (key: string, value: any) => {
        await encryptionService.setSecureItem(key, value);
    }, []);

    const getSecureItem = useCallback(async <T,>(key: string): Promise<T | null> => {
        return await encryptionService.getSecureItem<T>(key);
    }, []);

    // Callbacks
    const onSessionTimeout = useCallback((callback: () => void) => {
        sessionService.onTimeout(callback);
    }, []);

    const onSessionWarning = useCallback((callback: (remainingTime: number) => void) => {
        sessionService.onWarning(callback);
    }, []);

    return {
        // Session
        isSessionActive,
        sessionRemainingTime,
        startSession,
        endSession,
        refreshSession,

        // Authentication
        isAuthenticated,
        requiresAuth,
        authenticateWithWallet,
        authenticateWithBiometrics,
        clearAuth,

        // Encryption
        isEncryptionReady,
        initializeEncryption,
        encryptData,
        decryptData,
        setSecureItem,
        getSecureItem,

        // Callbacks
        onSessionTimeout,
        onSessionWarning,
    };
}
