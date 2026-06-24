import type { ReactNode } from 'react';

export const formInputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900';

type FormFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({ label, required, hint, className, children }: FormFieldProps) {
  return (
    <div className={className}>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
