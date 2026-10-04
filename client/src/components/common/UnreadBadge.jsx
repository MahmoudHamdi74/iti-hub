export default function UnreadBadge({ count, label = '' }) {
  if (!(count > 0)) return null;
  return <span className="absolute -end-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-neutral-50" aria-label={`${count} ${label}`.trim()}>
    {count > 99 ? '99+' : count}
  </span>;
}
