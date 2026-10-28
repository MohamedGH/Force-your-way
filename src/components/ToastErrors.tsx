import React from 'react';
import { useErrorStore } from '../store/error-store';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastErrors: React.FC = () => {
  const { errors, removeError } = useErrorStore();

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2">
      {errors.map((err) => (
        <div
          key={err.id}
          className={`pointer-events-auto rounded-xl p-3.5 shadow-lg border backdrop-blur-md flex items-start gap-3 transition transform duration-200 ${
            err.severity === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-100'
              : err.severity === 'warning'
              ? 'bg-amber-950/90 border-amber-800 text-amber-100'
              : 'bg-slate-800/90 border-slate-700 text-slate-100'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {err.severity === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {err.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {err.severity === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-tight">{err.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{err.message}</p>
            {err.actionLabel && err.onAction && (
              <button
                onClick={() => {
                  err.onAction?.();
                  removeError(err.id);
                }}
                className="mt-2 text-xs font-medium underline text-blue-300 hover:text-white"
              >
                {err.actionLabel}
              </button>
            )}
          </div>
          <button
            onClick={() => removeError(err.id)}
            className="shrink-0 text-slate-400 hover:text-white transition p-1"
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
