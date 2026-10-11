import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';
import { useAuthStore } from '@store/auth';
import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useIntlayer } from 'react-intlayer';
import toast from 'react-hot-toast';
import CommunityHeader from './CommunityHeader';
import CommunityInfo from './CommunityInfo';
import CommunityFeed from './CommunityFeed';
import CommunitySettings from './CommunitySettings';
import { useCommunityDetails } from '@hooks/queries/useCommunity';
import { useJoinCommunity, useLeaveCommunity, useUpdateCommunity, useUpdateCommunityProfilePicture, useUpdateCommunityCoverImage } from '@hooks/mutations/useCommunityMutations';
import NotFoundPage from '@pages/notfound/NotFoundPage';
import ErrorDisplay from '@components/common/ErrorDisplay';
import Loading from '@components/common/Loading';
export default function Community() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const user = useAuthStore(state => state.user);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = useMutation({ mutationFn: () => api.delete('/communities/' + communityId), onSuccess: () => { cache.removeQueries({ queryKey: ['community', communityId] }); cache.invalidateQueries(); navigate('/communities', { replace: true }); } });
  const text = useIntlayer('community');
  const [sidebar, setSidebar] = useState(false);
  const [settings, setSettings] = useState(false);
  const { data: community, isLoading, error, refetch } = useCommunityDetails(communityId);
  const join = useJoinCommunity(communityId), leave = useLeaveCommunity(communityId), update = useUpdateCommunity(communityId);
  const picture = useUpdateCommunityProfilePicture(communityId), cover = useUpdateCommunityCoverImage(communityId);
  const run = async action => { try { await action(); } catch (err) { toast.error(err?.response?.data?.error?.message || text.errorOccurred?.value); } };
  if (error?.response?.status === 404 || error?.response?.status === 400) return <NotFoundPage />;
  if (error) return <div className="p-5"><ErrorDisplay error={error} onRetry={refetch} /><Link to="/communities" className="mt-4 inline-block text-primary-600">{text.backToCommunities}</Link></div>;
  if (isLoading) return <div className="p-8"><Loading /></div>;
  if (!community) return <NotFoundPage />;
  const moderator = ['owner', 'moderator'].includes(community.role);
  const canDelete = community.role === 'owner' || ['admin', 'super_admin'].includes(user?.role);
  const controls = <div className="mb-4 flex flex-wrap gap-2">{moderator && <Link onClick={() => setSidebar(false)} to={`/community/${communityId}/manage`} className="rounded-lg border border-outline p-3">{text.manage}</Link>}{community.role === 'owner' && <button onClick={() => { setSidebar(false); setSettings(true); }} className="rounded-lg border border-outline p-3">{text.settings}</button>}{canDelete && <button onClick={() => { setSidebar(false); setConfirmDelete(true); }} className="rounded-lg border border-red-500 px-3 py-2 text-red-600">{text.deleteCommunity}</button>}</div>;
  return <div className="min-w-0 bg-neutral-50">
    <CommunityHeader community={community} isJoined={community.isJoined} isPending={community.isPending} isJoining={join.isPending || leave.isPending}
      onJoinLeave={() => run(() => community.isJoined ? leave.mutateAsync() : join.mutateAsync())}
      onProfilePictureUpdate={file => run(() => picture.mutateAsync(file))} onCoverImageUpdate={file => run(() => cover.mutateAsync(file))}
      onSettingsOpen={() => setSettings(true)} />
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5"><button onClick={() => setSidebar(true)} className="mb-4 w-full rounded-xl border border-outline bg-neutral-100 p-3 text-start lg:hidden">{text.communityDetails}</button><div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]"><div className="min-w-0"><CommunityFeed communityId={communityId} /></div><aside className="hidden min-w-0 lg:block">{controls}<CommunityInfo community={community} /></aside></div></div>
    <Dialog open={sidebar} onClose={() => setSidebar(false)} className="relative z-40 lg:hidden"><div className="fixed inset-0 bg-black/40" aria-hidden="true" /><DialogPanel className="fixed inset-y-0 end-0 w-[min(90vw,360px)] overflow-y-auto bg-neutral-50 p-4"><div className="mb-4 flex items-center justify-between"><DialogTitle className="font-bold">{text.communityDetails}</DialogTitle><button onClick={() => setSidebar(false)} aria-label={text.cancel?.value}>×</button></div>{controls}<CommunityInfo community={community} /></DialogPanel></Dialog>
    <Dialog open={confirmDelete} onClose={() => { if (!remove.isPending) setConfirmDelete(false); }} className="relative z-50"><div className="fixed inset-0 bg-black/50" aria-hidden="true" /><div className="fixed inset-0 flex items-center justify-center p-4"><DialogPanel className="w-full max-w-md rounded-2xl bg-neutral-100 p-6 text-neutral-900"><DialogTitle className="text-lg font-bold">{text.deleteCommunity}</DialogTitle><p className="my-4">{text.deleteWarning}</p><p className="mb-4 font-semibold break-words">{community.name}</p><ErrorDisplay error={remove.error} /><div className="flex justify-end gap-3"><button disabled={remove.isPending} onClick={() => setConfirmDelete(false)} className="rounded-lg border border-outline p-3">{text.cancel}</button><button disabled={remove.isPending} onClick={() => remove.mutate()} className="rounded-lg bg-red-600 p-3 text-white disabled:opacity-50">{text.deleteCommunity}</button></div></DialogPanel></div></Dialog>
    {settings && community.role === 'owner' && <CommunitySettings community={community} onSave={updates => update.mutateAsync(updates)} onClose={() => setSettings(false)} />}
  </div>;
}
