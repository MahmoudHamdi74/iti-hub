import { useUIStore } from '@/store/uiStore';

export default function RouteError() {
  const locale = useUIStore(state => state.locale);
  const arabic = locale === 'ar';
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-neutral-50 text-neutral-900" dir={arabic ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-semibold">{arabic ? 'تعذر عرض الصفحة' : 'Unable to display this page'}</h1>
      <p>{arabic ? 'حاول مرة أخرى أو ارجع للصفحة الرئيسية.' : 'Please try again or return to the home page.'}</p>
      <button className="rounded-lg bg-primary-600 px-5 py-3 text-white" onClick={() => window.location.reload()}>{arabic ? 'حاول مرة أخرى' : 'Try again'}</button>
      <a className="underline" href="/">{arabic ? 'الصفحة الرئيسية' : 'Home'}</a>
    </main>
  );
}
