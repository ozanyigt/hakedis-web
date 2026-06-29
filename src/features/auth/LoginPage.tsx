import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getApiErrorMessage } from '@/api/client';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/platform' : '/app'} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Ana sayfa
        </Link>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="flex flex-col items-center text-center">
            <BrandLogo size="lg" />
            <h1 className="mt-4 text-xl font-bold text-white">SahaMetrik</h1>
            <p className="text-sm text-slate-400">Kurumsal giriş</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-300">
              E-posta
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none ring-brand-500 focus:ring-2"
                placeholder="ornek@firma.com"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Şifre
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none ring-brand-500 focus:ring-2"
                placeholder="••••••••"
              />
            </label>

            {error ? (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Hesabınız yok mu?{' '}
            <Link to="/demo-talep" className="font-medium text-brand-400 hover:text-brand-300">
              Demo talep edin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
