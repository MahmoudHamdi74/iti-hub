import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { getSeo, publicPages, SITE_URL, metadataRoutes } from '../src/lib/seo.js';

const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
for (const pathname of metadataRoutes) {
  const seo = getSeo(pathname);
  const tags = `
    <meta name="description" content="${escape(seo.description)}" />
    <meta name="robots" content="${seo.robots}" />
    <link rel="canonical" href="${seo.canonical}" />
    <meta property="og:title" content="${escape(seo.title)}" />
    <meta property="og:description" content="${escape(seo.description)}" />
    <meta property="og:url" content="${seo.canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ITI Hub" />
    <meta property="og:image" content="${SITE_URL}/brand/logo.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escape(seo.title)}" />
    <meta name="twitter:description" content="${escape(seo.description)}" />
    <meta name="twitter:image" content="${SITE_URL}/brand/logo.png" />`;
  const html = template.replace(/<title>.*?<\/title>/, `<title>${escape(seo.title)}</title>${tags}`);
  const dir = new URL(`../dist${pathname === '/' ? '' : pathname}/`, import.meta.url);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('index.html', dir), html);
}
const urls = Object.keys(publicPages).map(path => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n');
await writeFile(new URL('../dist/sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
await writeFile(new URL('../dist/robots.txt', import.meta.url), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log('Generated public sitemap, robots.txt and route-specific metadata shells.');
