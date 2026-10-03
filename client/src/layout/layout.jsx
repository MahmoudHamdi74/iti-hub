import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { HiOutlineUser, HiOutlineXMark, HiPlus } from 'react-icons/hi2';
import { UserAvatar } from '@components/user/UserAvatar';
import BrandLogo from '@components/common/BrandLogo';
import AccountMenu from '@components/Sidebar/AccountMenu';
import SidebarSearch from '@components/Sidebar/SidebarSearch';
import { menuItems } from '@components/Sidebar/menuConfig';
import { GlobalNotificationHandler } from '@components/notifications/GlobalNotificationHandler';
import { GlobalMessagingHandler } from '@components/messaging/GlobalMessagingHandler';
import { useAuthStore } from '@store/auth';
import PostComposerModal from '@components/post/PostComposerModal';
import useRequireAuth from '@hooks/useRequireAuth';

export default function Layout() {
  const content = useIntlayer('sidebar');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const [compose, setCompose] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  const { requireAuth } = useRequireAuth();
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = event => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  const links = menuItems;
  const mobileLinks = ['home', 'messages', 'notifications', 'communities'].map(id => menuItems.find(item => item.id === id)).filter(Boolean);
  const navigation = (mobile = false) => links.map(item => <NavLink onClick={event => { setMenuOpen(false); if (!item.isPublic && !isAuthenticated) { event.preventDefault(); requireAuth(); } }} key={item.id} to={item.path} end={item.end} title={content[item.labelKey]?.value} className={({ isActive }) => `flex items-center gap-4 rounded-full px-4 py-3 hover:bg-neutral-100 ${isActive ? 'font-bold text-primary-600' : 'text-neutral-800'} ${mobile ? 'text-base' : 'text-xl'}`}><item.icon className="h-6 w-6 shrink-0" /><span className={mobile ? '' : 'hidden xl:inline'}>{content[item.labelKey]}</span></NavLink>);
  return <div className="min-h-screen bg-neutral-50 text-neutral-900">
    <header className="sticky top-0 z-30 border-b border-outline bg-neutral-50 lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
      <button className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-100" aria-label={content.menu?.value || 'Menu'} aria-expanded={menuOpen} aria-controls="mobile-sidebar" onClick={() => setMenuOpen(!menuOpen)}>{isAuthenticated ? <UserAvatar src={user?.profilePicture} alt={user?.fullName || 'Profile'} size="md" /> : <HiOutlineUser className="h-6 w-6" />}</button>
      <NavLink to="/" aria-label="ITI Hub"><BrandLogo className="h-10 w-10" /></NavLink>
      <SidebarSearch compact />
      </div>
      <nav aria-label={content.menu?.value || 'Navigation'} className="grid grid-cols-4">
        {mobileLinks.map(item => <NavLink key={item.id} to={item.path} end={item.end} onClick={event => { setMenuOpen(false); if (!item.isPublic && !isAuthenticated) { event.preventDefault(); requireAuth(); } }} className={({ isActive }) => `flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 border-b-2 px-1 text-[11px] ${isActive ? 'border-primary-600 font-bold text-primary-600' : 'border-transparent text-neutral-500'}`}><item.icon className="h-5 w-5" aria-hidden="true" /><span>{content[item.labelKey]}</span></NavLink>)}
      </nav>
    </header>
    {menuOpen && <div className="fixed inset-0 z-40 lg:hidden">
      <button type="button" tabIndex={-1} aria-label="Close sidebar" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/40" />
      <aside id="mobile-sidebar" aria-label={content.menu?.value || 'Menu'} className="absolute inset-y-0 start-0 flex w-[min(320px,85vw)] flex-col bg-neutral-50 p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-elevation-3">
        <div className="flex shrink-0 items-center justify-between pb-4"><BrandLogo className="h-10 w-10" /><button type="button" autoFocus aria-label="Close sidebar" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-100" onClick={() => setMenuOpen(false)}><HiOutlineXMark className="h-6 w-6" /></button></div>
        <nav className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto">{navigation(true)}</nav>
        <div className="mt-3 shrink-0 border-t border-outline pt-3">{isAuthenticated ? <AccountMenu /> : <NavLink onClick={() => setMenuOpen(false)} to="/login" className="block rounded-full bg-primary-600 p-3 text-center font-semibold text-white">{content.login}</NavLink>}</div>
      </aside>
    </div>}
    <div className="mx-auto flex max-w-[1500px] items-start">
      <aside className="sticky top-0 hidden h-screen w-[88px] shrink-0 flex-col px-2 py-3 lg:flex xl:w-[260px] xl:px-4">
        <NavLink to="/" aria-label="ITI Hub" className="mb-3 px-3"><BrandLogo className="h-12 w-12" /></NavLink>
        {/* Real search bar (xl: full pill — lg: icon button with floating
            panel) instead of a dead icon that only linked to /search, which
            had no input (work order item 1). */}
        <div className="mb-3"><SidebarSearch /></div>
        <nav className="no-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto" aria-label={content.menu?.value || 'Navigation'}>{navigation()}</nav>
        <button onClick={() => requireAuth(() => setCompose(true))} className="my-3 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary-600 p-3 font-bold text-white"><HiPlus className="h-6 w-6" /><span className="hidden xl:inline">{content.post}</span></button>
        {isAuthenticated ? <AccountMenu /> : <NavLink to="/login" className="rounded-full border border-outline px-2 py-3 text-center text-sm font-semibold">{content.login}</NavLink>}
      </aside>
      <main className="min-w-0 flex-1 pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-0">
        {isAuthenticated && <><GlobalNotificationHandler /><GlobalMessagingHandler /></>}
        <Outlet />
      </main>
    </div>
    <button onClick={() => requireAuth(() => setCompose(true))} aria-label={content.post?.value || 'Post'} className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] end-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-elevation-3 lg:hidden"><HiPlus className="h-6 w-6" /></button>
    <PostComposerModal isOpen={compose} onClose={() => setCompose(false)} />
  </div>;
}
