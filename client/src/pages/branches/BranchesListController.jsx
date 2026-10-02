import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import {
  HiOutlineAcademicCap,
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { useBranches } from '@hooks/queries/useCourse';
import { ErrorDisplay, PageBanner, Chip } from '@components/common';
import BranchCardSkeleton from './BranchCardSkeleton';

/** Safe dictionary accessor — never crashes if a key is missing */
const useBranchesContent = () => {
  const content = useIntlayer('branches');
  return (key, fallback = '') => content?.[key]?.value ?? fallback;
};

// Generic location words that don't identify a city/governorate
const AREA_STOPWORDS = new Set([
  'iti', 'branch', 'branches', 'extension', 'core', 'the', 'of', 'in', 'at',
  'and', 'new', 'main', 'center', 'centre', 'campus', 'governorate',
]);

const areaTokens = (str) =>
  String(str || '')
    .toLowerCase()
    .split(/[^a-z\u0600-\u06FF]+/)
    .filter((w) => w.length > 2 && !AREA_STOPWORDS.has(w));

/**
 * Pick the cover image of the "nearest" branch for a branch that has none
 * (work order item 7): same city/governorate token first, then same type,
 * then any branch that has an image.
 */
function pickNearbyBranchImage(branch, allBranches) {
  const withImage = (allBranches || []).filter((b) => b.coverImage && b._id !== branch._id);
  if (withImage.length === 0) return null;

  const myTokens = new Set([...areaTokens(branch.name), ...areaTokens(branch.location)]);
  const sameArea = withImage.find((b) =>
    [...areaTokens(b.name), ...areaTokens(b.location)].some((w) => myTokens.has(w))
  );
  if (sameArea) return sameArea.coverImage;

  const sameType = withImage.find((b) => (b.type ?? 'core') === (branch.type ?? 'core'));
  return sameType?.coverImage ?? withImage[0].coverImage;
}

/**
 * Single branch card — ink-navy → maroon diagonal header band (the
 * institutional side of the real ITI palette, distinguishing branches
 * from crimson track cards), glass type badge, body with name/location,
 * and a bordered meta footer.
 */
function BranchListItem({ branch, allBranches }) {
  const t = useBranchesContent();
  const navigate = useNavigate();
  const isCore = branch.type !== 'extension';

  // No image on this branch? Borrow one from a nearby branch instead of
  // showing the generic gradient (work order item 7).
  const coverImage = branch.coverImage || pickNearbyBranchImage(branch, allBranches);

  return (
    <button
      type="button"
      onClick={() => navigate(`/branches/${branch._id}`, { state: { coverImage } })}
      className="group w-full text-left bg-neutral-100 border border-outline rounded-xl overflow-hidden hover:shadow-elevation-3 hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      {/* Header band — the branch photo (own, or borrowed from a nearby
          branch) under a dark scrim; plain gradient as last resort. The old
          building icon is gone (work order item 7). */}
      <div className="relative h-28 bg-gradient-to-br from-ink-navy via-ink-navy-800 to-secondary-900 flex items-center justify-center">
        {coverImage && (
          <>
            <img
              src={coverImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-ink-navy/70" />
          </>
        )}
        {/* Decorative rings */}
        <span className="absolute -top-6 ltr:-right-6 rtl:-left-6 w-24 h-24 rounded-full border-[10px] border-white/10" />
        <span className="absolute -bottom-8 ltr:-left-4 rtl:-right-4 w-28 h-28 rounded-full border-[12px] border-black/5" />

        {/* Type badge — frosted dot-slug chip on the gradient (DESIGN.md glassmorphism) */}
        <Chip
          onDark
          className={`absolute top-3 ltr:right-3 rtl:left-3 ${isCore ? '' : 'bg-black/25 border-white/20'}`}
        >
          {isCore ? t('coreBranch', 'Core') : t('extensionBranch', 'Extension')}
        </Chip>
      </div>

      {/* Body — 16px mobile / 24px desktop card padding (DESIGN.md) */}
      <div className="p-4 sm:p-6">
        <h3 className="text-heading-6 text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
          {branch.name}
        </h3>

        {branch.location && (
          <p className="text-body-2 text-neutral-500 line-clamp-2 mt-1.5 min-h-[2.5rem]">
            {branch.location}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-outline text-caption text-neutral-500">
          <span className="flex items-center gap-1">
            <HiOutlineAcademicCap className="w-3.5 h-3.5" />
            {`${branch.activeTracks ?? 0} ${t('activeTracksLabel', 'active tracks')}`}
          </span>
          <span className="flex items-center gap-1">
            <HiOutlineUsers className="w-3.5 h-3.5" />
            {`${branch.students ?? 0} ${t('studentsLabel', 'students')}`}
          </span>
        </div>
      </div>
    </button>
  );
}


/**
 * Branches catalog — top level of the Branches → Rounds → Tracks drill-down.
 */
export default function BranchesListController() {
  const t = useBranchesContent();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Small debounce so we don't hit the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isError,
    refetch,
    isFetchingNextPage,
  } = useBranches(search ? { search } : {});

  const branches = data?.pages?.flatMap((page) => page.data?.data?.branches ?? []) ?? [];

  // Initial load (no cache at all) — full skeleton grid.
  // Subsequent fetches (search, refetch) keep the input mounted so typing
  // is never interrupted by a full-page skeleton swap.
  const showSkeletons = isLoading;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Signature gradient banner with inline glass search (work order v2 §1) */}
      <PageBanner
        title={t('title', 'Branches')}
        subtitle={t('subtitle', 'ITI training branches across Egypt — pick a branch to explore its rounds and tracks.')}
        icon={HiOutlineAcademicCap}
        className="mb-6"
      >
        <div className="relative w-full sm:w-80">
          <HiOutlineMagnifyingGlass className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 w-5 h-5 text-white/70 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchPlaceholder', 'Search branches...')}
            className={`w-full h-11 ltr:pl-10 rtl:pr-10 rounded-lg border border-white/25 bg-white/15 backdrop-blur-sm text-white text-sm placeholder:text-white/60 transition-colors hover:border-white/40 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/25 disabled:opacity-60 ${
              searchInput || (!isLoading && isFetching) ? 'ltr:pr-10 rtl:pl-10' : 'ltr:pr-4 rtl:pl-4'
            }`}
          />
          {/* Right-side affordance: clear button, or subtle spinner while fetching */}
          {!isLoading && isFetching ? (
            <span
              aria-hidden="true"
              className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
            />
          ) : searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 w-5 h-5 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
            >
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </PageBanner>

      {isError ? (
        <ErrorDisplay message={t('errorLoadingBranches', 'Failed to load branches')} onRetry={refetch} />
      ) : showSkeletons ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <BranchCardSkeleton key={i} />
          ))}
        </div>
      ) : branches.length === 0 ? (
        /* Empty state — same card treatment as content cards */
        <div className="bg-neutral-100 border border-outline rounded-xl py-16 px-6 text-center">
          <HiOutlineAcademicCap className="w-10 h-10 mx-auto text-neutral-500" strokeWidth={1.3} />
          <h2 className="text-heading-5 text-neutral-900 mt-3 mb-1">{t('noBranchesTitle', 'No branches found')}</h2>
          <p className="text-body-2 text-neutral-500">
            {t('noBranchesMessage', 'Try a different search, or check back later.')}
          </p>
        </div>
      ) : (
        <>
          {/* Branches grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <BranchListItem key={branch._id} branch={branch} allBranches={branches} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2.5 bg-neutral-100 border border-outline text-neutral-800 rounded-full text-body-2 font-medium hover:bg-surface hover:border-neutral-300 transition-colors shadow-elevation-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? t('loadingMore', 'Loading more...') : t('loadMore', 'Load more')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
