import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import {
  HiArrowLeft,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineAcademicCap,
  HiChevronRight,
} from 'react-icons/hi2';
import { useBranchDetail } from '@hooks/queries/useCourse';
import { Loading, ErrorDisplay, PageBanner, Chip } from '@components/common';

/** Safe dictionary accessor — never crashes if a key is missing */
const useBranchesContent = () => {
  const content = useIntlayer('branches');
  return (key, fallback = '') => content?.[key]?.value ?? fallback;
};

/**
 * Single round row inside the branch detail page.
 * Clicking drills down into the round's tracks.
 */
function RoundItem({ round, branchId }) {
  const t = useBranchesContent();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/branches/${branchId}/rounds/${round._id}`)}
      className="group w-full flex items-center gap-4 p-5 hover:bg-surface transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-md bg-primary-600/10 flex items-center justify-center shrink-0">
        <HiOutlineAcademicCap className="w-6 h-6 text-primary-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-heading-6 text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
            {round.name}
          </h4>
          <Chip
            size="xs"
            tone={
              round.isActive
                ? 'border-success/25 bg-success/10 text-success'
                : 'border-outline bg-surface-high text-neutral-500'
            }
          >
            {round.isActive ? t('active', 'Active') : t('closed', 'Closed')}
          </Chip>
        </div>
        <p className="text-body-2 text-neutral-500 mt-1">
          {`${round.trackCount ?? 0} ${t('tracksCount', 'tracks')}`}
        </p>
      </div>

      <span className="hidden sm:inline text-caption font-semibold text-primary-600 shrink-0 group-hover:underline underline-offset-4">
        {t('viewTracks', 'View tracks')}
      </span>
      <HiChevronRight className="w-5 h-5 text-neutral-500 ltr:rotate-0 rtl:rotate-180 shrink-0 group-hover:text-primary-600 transition-colors" />
    </button>
  );
}

/**
 * Branch detail — shows the branch header and its rounds
 * (second level of the Branches → Rounds → Tracks drill-down).
 */
export default function BranchDetailController() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useBranchesContent();

  const { data, isLoading, isError, refetch } = useBranchDetail(branchId);

  const branch = data?.data?.data?.branch;
  const rounds = data?.data?.data?.rounds ?? [];
  const totalStudents = data?.data?.data?.totalStudents ?? 0;

  // The list page passes a borrowed cover image (from a nearby branch) via
  // navigation state for branches that have none (work order item 7).
  const fallbackCover = location.state?.coverImage || undefined;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 flex justify-center">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ErrorDisplay message={t('errorLoadingBranch', 'Failed to load branch details')} onRetry={refetch} />
      </div>
    );
  }

  const isCore = branch?.type !== 'extension';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/branches')}
        className="flex items-center gap-2 text-body-2 text-neutral-500 hover:text-primary-600 transition-colors mb-6"
      >
        <HiArrowLeft className="w-5 h-5 ltr:rotate-0 rtl:rotate-180" />
        <span>{t('backToBranches', 'Back to branches')}</span>
      </button>

      {/* Branch header — signature gradient banner (work order v2 §1) */}
      <PageBanner
        title={branch?.name}
        icon={HiOutlineAcademicCap}
        image={branch?.coverImage || fallbackCover}
        subtitle={
          (branch?.location || totalStudents > 0) && (
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {branch?.location && (
                <span className="inline-flex items-center gap-1.5">
                  <HiOutlineMapPin className="h-4 w-4 shrink-0" />
                  {branch.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineUsers className="h-4 w-4 shrink-0" />
                {`${totalStudents} ${t('studentsLabel', 'students')}`}
              </span>
            </span>
          )
        }
        className="mb-6"
      >
        <Chip
          onDark
          className={isCore ? '' : 'bg-white/10 text-white/85'}
        >
          {isCore ? t('coreBranch', 'Core') : t('extensionBranch', 'Extension')}
        </Chip>
      </PageBanner>

      {/* Rounds */}
      <section>
        <h2 className="text-heading-5 text-neutral-900 mb-4">{t('roundsTitle', 'Rounds')}</h2>

        {rounds.length === 0 ? (
          <div className="bg-neutral-100 border border-outline rounded-xl py-12 px-6 text-center">
            <HiOutlineAcademicCap className="w-10 h-10 mx-auto text-neutral-500" strokeWidth={1.3} />
            <h3 className="text-heading-5 text-neutral-900 mt-3 mb-1">{t('noRoundsTitle', 'No rounds yet')}</h3>
            <p className="text-body-2 text-neutral-500">
              {t('noRoundsMessage', 'This branch has no rounds yet. Check back later!')}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-100 border border-outline rounded-xl overflow-hidden divide-y divide-outline">
            {rounds.map((round) => (
              <RoundItem key={round._id} round={round} branchId={branchId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
