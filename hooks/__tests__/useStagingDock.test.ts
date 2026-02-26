import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStagingDock } from '../useStagingDock';
import { TransactionStatus, TransactionType } from '../../types';
import { NotificationManager } from '../../utils/notifications';

vi.mock('../../utils/notifications');

describe('useStagingDock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (NotificationManager.getPreferences as any).mockReturnValue({
      enabled: true,
      sound: true,
      soundType: 'default',
      grouping: false,
      showOnNewItem: true,
      showOnSignature: true,
      showOnConfirmation: true
    });
    (NotificationManager.shouldGroup as any).mockReturnValue(false);
  });

  it('adds transaction to queue', () => {
    const { result } = renderHook(() => useStagingDock());
    
    act(() => {
      result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'Test payment',
        requiresSignature: false
      });
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].description).toBe('Test payment');
  });

  it('updates transaction status', () => {
    const { result } = renderHook(() => useStagingDock());
    
    let txId: string;
    act(() => {
      txId = result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'Test',
        requiresSignature: false
      });
    });

    act(() => {
      result.current.updateTransaction(txId, { status: TransactionStatus.CONFIRMED });
    });

    expect(result.current.transactions[0].status).toBe(TransactionStatus.CONFIRMED);
  });

  it('removes transaction from queue', () => {
    const { result } = renderHook(() => useStagingDock());
    
    let txId: string;
    act(() => {
      txId = result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'Test',
        requiresSignature: false
      });
    });

    act(() => {
      result.current.removeTransaction(txId);
    });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('clears completed transactions', () => {
    const { result } = renderHook(() => useStagingDock());
    
    act(() => {
      result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.CONFIRMED,
        description: 'Completed',
        requiresSignature: false
      });
      result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'Pending',
        requiresSignature: false
      });
    });

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].description).toBe('Pending');
  });

  it('shows toast on new transaction', () => {
    const { result } = renderHook(() => useStagingDock());
    
    act(() => {
      result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'New payment',
        requiresSignature: false
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toContain('New payment');
  });

  it('shows toast on signature required', () => {
    const { result } = renderHook(() => useStagingDock());
    
    let txId: string;
    act(() => {
      txId = result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'Payment',
        requiresSignature: true
      });
    });

    act(() => {
      result.current.updateTransaction(txId, { status: TransactionStatus.SIGNING });
    });

    const sigToast = result.current.toasts.find(t => t.type === 'warning');
    expect(sigToast).toBeDefined();
  });

  it('shows toast on confirmation', () => {
    const { result } = renderHook(() => useStagingDock());
    
    let txId: string;
    act(() => {
      txId = result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.SUBMITTED,
        description: 'Payment',
        requiresSignature: false
      });
    });

    act(() => {
      result.current.updateTransaction(txId, { status: TransactionStatus.CONFIRMED });
    });

    const confirmToast = result.current.toasts.find(t => t.type === 'success');
    expect(confirmToast).toBeDefined();
  });

  it('bundles signatures for multiple transactions', () => {
    const { result } = renderHook(() => useStagingDock());
    
    const txIds: string[] = [];
    act(() => {
      txIds.push(result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'Payment 1',
        requiresSignature: true
      }));
      txIds.push(result.current.addTransaction({
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'Payment 2',
        requiresSignature: true
      }));
    });

    let bundleId: string;
    act(() => {
      bundleId = result.current.bundleSignatures(txIds);
    });

    expect(bundleId).toContain('bundle-');
    expect(result.current.toasts.some(t => t.message.includes('Bundling 2 transactions'))).toBe(true);
  });

  it('updates notification preferences', () => {
    const { result } = renderHook(() => useStagingDock());
    
    act(() => {
      result.current.setNotificationPreferences({ sound: false });
    });

    expect(NotificationManager.setPreferences).toHaveBeenCalledWith({ sound: false });
  });
});
