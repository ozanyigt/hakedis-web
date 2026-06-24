import { Download, Loader2 } from 'lucide-react';

interface ExportExcelButtonProps {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  className?: string;
}

export function ExportExcelButton({
  label = 'Excel indir',
  disabled = false,
  loading = false,
  onClick,
  className = '',
}: ExportExcelButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
      {loading ? 'İndiriliyor...' : label}
    </button>
  );
}
