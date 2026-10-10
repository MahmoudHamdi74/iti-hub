export const SITE_URL = 'https://www.itihub.tech';
export const publicPages = {
  '/': { title: 'ITI Hub | Connect, learn and share', description: 'Connect with the ITI community. Explore learning tracks, branches and communities, and share knowledge with fellow developers.' },
  '/communities': { title: 'Communities | ITI Hub', description: 'Discover ITI Hub communities and connect with people who share your technical interests.' },
  '/branches': { title: 'ITI Branches | ITI Hub', description: 'Explore ITI branches and discover their learning tracks and training rounds.' },
  '/tracks': { title: 'Learning Tracks | ITI Hub', description: 'Browse technical learning tracks, specializations and training opportunities on ITI Hub.' },
};

export function getSeo(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = publicPages[path];
  return { ...(page || { title: 'ITI Hub', description: publicPages['/'].description }),
    canonical: SITE_URL + (path === '/' ? '/' : path), robots: page ? 'index, follow' : 'noindex, follow' };
}

export const privatePages = ['/login', '/register', '/verify-otp', '/verify-email', '/resend-verification', '/password-reset/request', '/password-reset/confirm', '/search', '/messages', '/notifications', '/settings', '/saved', '/jobs', '/events'];
export const metadataRoutes = [...Object.keys(publicPages), ...privatePages];
