import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Calculator,
  ClipboardList,
  Layers,
  Receipt,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { PageMeta } from '@/components/seo/PageMeta';
import { MarketingFooter } from '@/features/marketing/MarketingFooter';
import { MarketingHeader } from '@/features/marketing/MarketingHeader';

const FEATURES = [
  {
    icon: Layers,
    title: 'DXF Katman Eşlemesi',
    description:
      'Çizim katmanlarını metraj kalemlerine proje bazında bağlayın. Türkçe katman adlarıyla esnek hesaplama.',
  },
  {
    icon: Calculator,
    title: 'Otomatik Metraj',
    description: 'DXF dosyalarından duvar, sıva, boya, şap ve daha fazlasını hesaplayın. (Şu an DXF; DWG için DXF kaydı gerekir.)',
  },
  {
    icon: Sparkles,
    title: 'Yapay Zeka Destekli Hüküm',
    description:
      'Firma metraj politikasına göre sayılacak / ihmal edilecek alanları yapay zeka önerir; nihai karar sizde kalır.',
  },
  {
    icon: ClipboardList,
    title: 'Puantaj Takibi',
    description: 'Şantiye personelini, giriş-çıkış ve iş gücü kayıtlarını dijital ortamda yönetin.',
  },
  {
    icon: Receipt,
    title: 'Hakediş Yönetimi',
    description: 'Sözleşme kalemleri, ilerleme ve dönemsel hakedişleri tek akışta takip edin.',
  },
  {
    icon: Users,
    title: 'Rol Bazlı Erişim',
    description: 'Metraj mühendisi, puantör, şantiye şefi ve muhasebe için ayrı yetkiler.',
  },
  {
    icon: Shield,
    title: 'Kurumsal Güvenlik',
    description: 'Çok kiracılı mimari ile her firmanın verisi izole ve güvenli şekilde saklanır.',
  },
] as const;

const MODULES = [
  {
    icon: Calculator,
    name: 'Metraj',
    color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    items: ['DXF yükleme', 'Katman eşleme', 'Yapay zeka inceleme önerisi', 'Excel export'],
  },
  {
    icon: ClipboardList,
    name: 'Puantaj',
    color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    items: ['Personel kayıtları', 'Günlük puantaj', 'Onay akışı'],
  },
  {
    icon: Receipt,
    name: 'Hakediş',
    color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
    items: ['Sözleşme kalemleri', 'İlerleme girişi', 'Dönem yönetimi'],
  },
] as const;

const STEPS = [
  { step: '01', title: 'Demo talep edin', text: 'Ekibimiz firmanız için uygun planı belirler ve hesabınızı açar.' },
  { step: '02', title: 'Projelerinizi tanımlayın', text: 'Şantiyeler, çizimler ve kullanıcı rolleri birkaç dakikada hazır.' },
  {
    step: '03',
    title: 'Metrajdan hakedişe',
    text: 'DXF metraj, yapay zeka destekli inceleme, puantaj ve hakediş verileri tek panelde birleşir.',
  },
] as const;

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageMeta
        title="SahaMetrik — İnşaat Metraj, Puantaj ve Hakediş Yazılımı"
        description="SahaMetrik ile inşaat metraj (DXF), şantiye puantajı ve hakediş yönetimini tek platformda yürütün. Firmalar için demo talep edin."
        path="/"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'SahaMetrik',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: 'https://sahametrik.com/',
            description:
              'İnşaat firmaları için metraj, puantaj ve hakediş yönetim yazılımı.',
            offers: {
              '@type': 'Offer',
              url: 'https://sahametrik.com/demo-talep',
              priceCurrency: 'TRY',
              availability: 'https://schema.org/OnlineOnly',
            },
            publisher: {
              '@type': 'Organization',
              name: 'SahaMetrik',
              url: 'https://sahametrik.com/',
            },
          }),
        }}
      />
      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/30 via-slate-950 to-slate-950" />
          <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
            <BrandLogo variant="hero" className="mb-8" />

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur">
              <Sparkles size={14} className="text-cyan-300" />
              Yapay zeka destekli metraj ve saha yönetimi
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              SahaMetrik — inşaat metraj, puantaj ve hakediş
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Şantiyenizi ölçün, sürecinizi yönetin. DXF metraj, puantaj ve hakediş tek platformda.
              Metrajda yapay zeka şüpheli kalemleri işaretler; nihai onay sizde kalır.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/demo-talep"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:bg-brand-500"
              >
                Demo Talep Et
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Giriş Yap
              </Link>
            </div>

            <div className="mt-16 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Building2, label: 'Çok kiracılı mimari' },
                { icon: Sparkles, label: 'Yapay zeka destekli metraj' },
                { icon: Layers, label: 'Proje bazlı katman kuralları' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur"
                >
                  <item.icon className="text-brand-400" size={20} />
                  <span className="text-sm font-medium text-slate-200">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="ozellikler" className="border-t border-white/10 bg-slate-900/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Özellikler</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Saha operasyonları için eksiksiz araç seti</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 transition hover:border-brand-500/30 hover:bg-slate-950"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                    <feature.icon size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="moduller" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Modüller</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">İhtiyacınıza göre modül seçin</h2>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {MODULES.map((module) => (
                <div
                  key={module.name}
                  className={`rounded-2xl border bg-gradient-to-b p-6 ${module.color}`}
                >
                  <module.icon className="text-white" size={28} />
                  <h3 className="mt-4 text-xl font-bold">{module.name}</h3>
                  <ul className="mt-4 space-y-2">
                    {module.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="nasil-calisir" className="border-t border-white/10 bg-slate-900/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Nasıl çalışır</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Dakikalar içinde başlayın</h2>
            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step} className="relative">
                  <p className="text-5xl font-bold text-white/10">{item.step}</p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-600/20 via-slate-900 to-slate-950 p-8 sm:p-12">
              <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">
                SahaMetrik&apos;i firmanızda denemek ister misiniz?
              </h2>
              <p className="mt-4 max-w-xl text-slate-300">
                Demo talebinizi iletin; ekibimiz firmanızı oluşturup aboneliğinizi tanımlasın ve ilk
                kullanıcı hesabınızı açsın.
              </p>
              <Link
                to="/demo-talep"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                İletişime Geç
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
