import { useEffect } from 'react';

const SITE_ORIGIN = 'https://sahametrik.com';

type PageMetaProps = {
  title: string;
  description: string;
  path?: string;
  /** false = noindex (login, app vb.) */
  index?: boolean;
};

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/** Kamu sayfalarında title / description / canonical; bağımlılık eklemeden. */
export function PageMeta({ title, description, path = '/', index = true }: PageMetaProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const canonical = path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: index ? 'index, follow' : 'noindex, nofollow',
    });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'tr_TR' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'SahaMetrik' });
    upsertLink('canonical', canonical);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, path, index]);

  return null;
}
