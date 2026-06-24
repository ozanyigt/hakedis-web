import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppDialog, type DialogVariant } from '@/components/ui/AppDialog';

interface AlertOptions {
  title?: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface DialogContextValue {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface DialogState {
  open: boolean;
  mode: 'alert' | 'confirm';
  title: string;
  message: string;
  variant: DialogVariant;
  confirmLabel: string;
  cancelLabel: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const initialState: DialogState = {
  open: false,
  mode: 'alert',
  title: '',
  message: '',
  variant: 'default',
  confirmLabel: 'Tamam',
  cancelLabel: 'Vazgeç',
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(initialState);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const closeDialog = useCallback((result: boolean) => {
    setDialog((current) => ({ ...current, open: false }));
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
      setDialog({
        open: true,
        mode: 'alert',
        title: options.title ?? 'Bilgi',
        message: options.message,
        variant: options.variant ?? 'default',
        confirmLabel: options.confirmLabel ?? 'Tamam',
        cancelLabel: 'Vazgeç',
      });
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        open: true,
        mode: 'confirm',
        title: options.title ?? 'Onay',
        message: options.message,
        variant: options.variant ?? 'warning',
        confirmLabel: options.confirmLabel ?? 'Evet',
        cancelLabel: options.cancelLabel ?? 'Vazgeç',
      });
    });
  }, []);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <AppDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        showCancel={dialog.mode === 'confirm'}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog yalnızca DialogProvider içinde kullanılabilir.');
  }
  return context;
}
