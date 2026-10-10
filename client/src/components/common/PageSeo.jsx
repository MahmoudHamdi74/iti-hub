import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeo, SITE_URL } from '@lib/seo';

export default function PageSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const seo = getSeo(pathname);
    document.title = seo.title;
    const meta = (attribute, name, value) => {
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.appendChild(element); }
      element.content = value;
    };
    for (const [name, value] of Object.entries({ description: seo.description, robots: seo.robots, 'twitter:card': 'summary', 'twitter:title': seo.title, 'twitter:description': seo.description, 'twitter:image': `${SITE_URL}/brand/logo.png` })) meta('name', name, value);
    for (const [name, value] of Object.entries({ 'og:title': seo.title, 'og:description': seo.description, 'og:url': seo.canonical, 'og:type': 'website', 'og:site_name': 'ITI Hub', 'og:image': `${SITE_URL}/brand/logo.png` })) meta('property', name, value);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = seo.canonical;
  }, [pathname]);
  return null;
}
