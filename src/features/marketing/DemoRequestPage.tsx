import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, Phone } from 'lucide-react';
import { submitDemoRequest } from '@/api/demoRequests';
import { getApiErrorMessage } from '@/api/client';
import { MarketingFooter } from '@/features/marketing/MarketingFooter';
import { MarketingHeader } from '@/features/marketing/MarketingHeader';

const INTEREST_OPTIONS = [
  { value: 'metraj', label: 'Metraj modülü' },
  { value: 'full', label: 'Tam paket (Metraj + Puantaj + Hakediş)' },
  { value: 'demo', label: 'Genel demo / bilgi almak istiyorum' },
] as const;

export function DemoRequestPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      await submitDemoRequest({
        companyName: String(formData.get('company') ?? ''),
        contactName: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        interest: String(formData.get('interest') ?? 'demo'),
        message: String(formData.get('message') ?? '') || undefined,
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Demo talep</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">İletişime geçin</h1>
            <p className="mt-4 max-w-xl text-slate-400">
              SahaMetrik kurumsal bir SaaS platformudur. Hesaplar platform yöneticisi tarafından
              açılır. Formu doldurun; ekibimiz en kısa sürede sizinle iletişime geçsin.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <Mail className="mt-0.5 shrink-0 text-brand-400" size={18} />
                <div>
                  <p className="font-medium">E-posta</p>
                  <a href="mailto:info@sahametrik.com" className="text-sm text-slate-400 hover:text-white">
                    info@sahametrik.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <Phone className="mt-0.5 shrink-0 text-brand-400" size={18} />
                <div>
                  <p className="font-medium">Telefon</p>
                  <p className="text-sm text-slate-400">Demo talebi sonrası paylaşılacaktır</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur sm:p-8">
            {submitted ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto text-emerald-400" size={48} />
                <h2 className="mt-4 text-xl font-semibold">Talebiniz alındı</h2>
                <p className="mt-2 text-sm text-slate-400">
                  En kısa sürede sizinle iletişime geçeceğiz. Firma ve abonelik kurulumu tamamlandığında
                  giriş bilgileriniz e-posta ile iletilecektir.
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-block text-sm font-medium text-brand-400 hover:text-brand-300"
                >
                  Ana sayfaya dön
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold">Demo talep formu</h2>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-300">Firma adı</span>
                    <input
                      required
                      name="company"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none ring-brand-500 focus:ring-2"
                      placeholder="Örn. Demo İnşaat A.Ş."
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium text-slate-300">Ad Soyad</span>
                    <input
                      required
                      name="name"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none ring-brand-500 focus:ring-2"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium text-slate-300">E-posta</span>
                    <input
                      required
                      type="email"
                      name="email"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none ring-brand-500 focus:ring-2"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium text-slate-300">Telefon</span>
                    <input
                      required
                      type="tel"
                      name="phone"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none ring-brand-500 focus:ring-2"
                      placeholder="05xx xxx xx xx"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium text-slate-300">İlgi alanı</span>
                    <select
                      required
                      name="interest"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none ring-brand-500 focus:ring-2"
                      defaultValue="demo"
                    >
                      {INTEREST_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium text-slate-300">Mesaj (opsiyonel)</span>
                    <textarea
                      name="message"
                      rows={3}
                      className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none ring-brand-500 focus:ring-2"
                      placeholder="Proje hacmi, kullanıcı sayısı vb."
                    />
                  </label>

                  {error ? (
                    <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
                  >
                    {loading ? 'Gönderiliyor...' : 'Demo Talep Et'}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-slate-500">
                  Zaten hesabınız var mı?{' '}
                  <Link to="/login" className="text-brand-400 hover:underline">
                    Giriş yapın
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
