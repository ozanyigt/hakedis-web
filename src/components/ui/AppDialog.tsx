import { AlertTriangle, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

export type DialogVariant = 'default' | 'danger' | 'warning';

interface AppDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles: Record<DialogVariant, { icon: typeof Info; iconClass: string; confirmClass: string }> = {
  default: {
    icon: Info,
    iconClass: 'bg-brand-100 text-brand-700',
    confirmClass: 'bg-brand-600 hover:bg-brand-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'bg-amber-100 text-amber-700',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  danger: {
    icon: AlertTriangle,
    iconClass: 'bg-red-100 text-red-700',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
};

export function AppDialog({
  open,
  title,
  message,
  variant = 'default',
  confirmLabel = 'Tamam',
  cancelLabel = 'Vazgeç',
  showCancel = false,
  onConfirm,
  onCancel,
}: AppDialogProps) {
  if (!open) {
    return null;
  }

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Dialog arka planı"
        onClick={showCancel ? onCancel : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className="relative z-[101] w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Kapat"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className={`rounded-full p-2.5 ${styles.iconClass}`}>
            <Icon size={20} />
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <h2 id="app-dialog-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <div className="mt-2 text-sm leading-6 text-slate-600">{message}</div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {showCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${styles.confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
