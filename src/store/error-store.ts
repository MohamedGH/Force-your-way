/**
 * Error Manager Store
 * Handles application errors, warnings, quota states, and alerts
 */

import { create } from 'zustand';

export interface AppError {
  id: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ErrorState {
  errors: AppError[];
  isQuotaExceeded: boolean;
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => string;
  removeError: (id: string) => void;
  clearAllErrors: () => void;
  setQuotaExceeded: (exceeded: boolean) => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],
  isQuotaExceeded: false,

  addError: (err) => {
    const id = `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newError: AppError = {
      ...err,
      id,
      timestamp: Date.now(),
    };
    set((state) => ({
      errors: [newError, ...state.errors.slice(0, 4)], // Keep at most 5 recent errors
    }));
    return id;
  },

  removeError: (id) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    })),

  clearAllErrors: () => set({ errors: [] }),

  setQuotaExceeded: (isQuotaExceeded) => set({ isQuotaExceeded }),
}));
