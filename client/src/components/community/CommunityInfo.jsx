import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { useCommunityMembersInfinite } from '@hooks/queries/useCommunity';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import ErrorDisplay from '@components/common/ErrorDisplay';
import ModeratorsList from './ModeratorsList';
function Members({ communityId }) {
  const text = useIntlayer('community');
  const { data, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useCommunityMembersInfinite(communityId, { limit: 20 });
  const { observerTarget } = useIntersectionObserver({ enabled: hasNextPage && !isFetchingNextPage && !error, onIntersect: fetchNextPage });
  return <div className="space-y-3"><ErrorDisplay error={error} onRetry={refetch} />{data?.pages.flatMap(p => p.members || []).map(member => <Link key={member._id} to={'/profile/' + member.username} className="flex min-w-0 items-center gap-3 rounded-lg bg-neutral-50 p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100">{member.profilePicture ? <img src={member.profilePicture} alt="" className="h-full w-full object-cover" /> : member.username?.[0]}</span><span className="min-w-0 truncate">{member.fullName || member.username}</span></Link>)}{hasNextPage && <button ref={observerTarget} disabled={isFetchingNextPage} onClick={() => fetchNextPage()} className="min-h-10 w-full">{text.loadingMore}</button>}</div>;
}
export default function CommunityInfo({ community }) {
  const text = useIntlayer('community');
  const [membersOpen, setMembersOpen] = useState(false);
  return <div className="space-y-4"><section className="rounded-xl border border-outline bg-neutral-100 p-4"><h2 className="mb-2 font-bold">{text.aboutCommunity}</h2><p className="whitespace-pre-wrap break-words text-sm text-neutral-600">{community.description}</p><div className="mt-4 flex gap-4 text-sm"><span>{community.memberCount} {text.members}</span><span>{community.postCount} {text.posts}</span></div></section><ModeratorsList community={community} /><section className="rounded-xl border border-outline bg-neutral-100 p-4"><button onClick={() => setMembersOpen(v => !v)} aria-expanded={membersOpen} className="mb-3 w-full text-start font-bold">{text.membersTitle} ({community.memberCount})</button>{membersOpen && <Members communityId={community._id} />}</section></div>;
}
