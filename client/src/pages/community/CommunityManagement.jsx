import ErrorDisplay from '@components/common/ErrorDisplay';
import NotFoundPage from '@pages/notfound/NotFoundPage';
import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { FaShieldAlt, FaUsers, FaCrown, FaUserPlus, FaUserMinus, FaArrowLeft } from 'react-icons/fa';
import { AiOutlineUserAdd, AiOutlineUserDelete } from 'react-icons/ai';
import { useIntlayer } from 'react-intlayer';
import toast from 'react-hot-toast';
import { useCommunityDetails, useCommunityMembersInfinite, useCommunityJoinRequests } from '@hooks/queries/useCommunity';
import { useAddModerator, useRemoveModerator, useKickMember, useDecideCommunityJoinRequest } from '@hooks/mutations/useCommunityMutations';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import useRequireAuth from '@hooks/useRequireAuth';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { Chip } from '@components/common';

/**
 * CommunityManagement Page
 * Management dashboard for community moderators and owners
 * Only accessible by moderators and owners
 */
const CommunityManagement = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const content = useIntlayer('community');
  const { requireAuth } = useRequireAuth();
  
  const [selectedRole, setSelectedRole] = useState('all'); // 'all' | 'member' | 'moderator' | 'owner'
  const [searchTerm, setSearchTerm] = useState('');
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [memberToKick, setMemberToKick] = useState(null);

  // Fetch community details to check role
  const { data: community, isLoading: loadingCommunity, error: communityError, refetch: retryCommunity } = useCommunityDetails(communityId);

  // Fetch members with infinite scroll
  const {
    data: membersData,
    isLoading: loadingMembers,
    error: membersError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useCommunityMembersInfinite(communityId, {
    limit: 20,
    role: selectedRole === 'all' ? undefined : selectedRole,
    search: searchTerm || undefined
  });

  // Mutations
  const addModeratorMutation = useAddModerator(communityId);
  const removeModeratorMutation = useRemoveModerator(communityId);
  const kickMemberMutation = useKickMember(communityId);
  const decideJoinRequestMutation = useDecideCommunityJoinRequest(communityId);

  // Pending join requests review queue (work order §4) — 403 just means
  // the user isn't a moderator, so don't retry or surface an error there.
  const {
    data: joinRequestsData,
    isLoading: loadingJoinRequests,
  } = useCommunityJoinRequests(communityId, 'pending');
  const pendingJoinRequests = joinRequestsData?.requests ?? [];

  // Decide (approve/reject) a join request with a toast on failure
  const handleDecideJoinRequest = (requestId, decision) => {
    decideJoinRequestMutation.mutate(
      { requestId, decision },
      {
        onError: (err) => {
          const message =
            err?.response?.data?.error?.message ||
            (decision === 'approved'
              ? content.joinRequestApprovedFailed?.value || 'Failed to approve request'
              : content.joinRequestRejectedFailed?.value || 'Failed to reject request');
          toast.error(message);
        },
      }
    );
  };

  // Infinite scroll observer
  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage,
  });

  // Flatten members from pages
  const members = membersData?.pages?.flatMap(page => page.members) || [];

  // Check if user has access (must be owner or moderator)
  const isOwner = community?.role === 'owner';
  const isModerator = community?.role === 'moderator' || community?.role === 'owner';

  // Handle add moderator
  const handleAddModerator = (userId) => {
    requireAuth(async () => {
      try {
        await addModeratorMutation.mutateAsync(userId);
      } catch (err) {
        console.error('Error adding moderator:', err);
      }
    });
  };

  // Handle remove moderator
  const handleRemoveModerator = (userId) => {
    requireAuth(async () => {
      try {
        await removeModeratorMutation.mutateAsync(userId);
      } catch (err) {
        console.error('Error removing moderator:', err);
      }
    });
  };

  // Handle kick member
  const handleKickMember = (userId) => {
    requireAuth(async () => {
      try {
        await kickMemberMutation.mutateAsync(userId);
      } catch (err) {
        console.error('Error kicking member:', err);
      }
    });
  };

  // Navigate to member profile
  const handleMemberClick = (username) => {
    navigate(`/profile/${username}`);
  };

  // Loading state
  if (loadingCommunity) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-body-1 text-neutral-600">{content.loading}</p>
        </div>
      </div>
    );
  }

  if (communityError?.response?.status === 404) return <NotFoundPage />;
  if (communityError) return <ErrorDisplay error={communityError} onRetry={retryCommunity} />;

  // Access denied - redirect to community page
  if (!isModerator) {
    return <Navigate to={`/community/${communityId}`} replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-100 border-b border-neutral-200 shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/community/${communityId}`)}
                className="p-2 rounded-lg hover:bg-neutral-200 transition-colors"
                aria-label="Back to community"
              >
                <FaArrowLeft size={20} className="text-neutral-700" />
              </button>
              <div>
                <h1 className="text-heading-3 text-neutral-900 font-bold flex items-center gap-2">
                  <FaShieldAlt className="text-secondary-600" />
                  {content.manageCommunity || 'Manage Community'}
                </h1>
                <p className="text-body-2 text-neutral-600 mt-1">
                  {community?.name}
                </p>
              </div>
            </div>
            {isOwner && (
              <Chip
                icon={FaCrown}
                dot={false}
                tone="border-transparent bg-error-100 text-error-700"
              >
                {content.owner || 'Owner'}
              </Chip>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <FaUsers size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="text-caption text-neutral-600">{content.totalMembers || 'Total Members'}</p>
                <p className="text-heading-4 text-neutral-900 font-bold">{community?.memberCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                <FaShieldAlt size={24} className="text-secondary-600" />
              </div>
              <div>
                <p className="text-caption text-neutral-600">{content.moderators || 'Moderators'}</p>
                <p className="text-heading-4 text-neutral-900 font-bold">{community?.moderators?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FaCrown size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-caption text-neutral-600">{content.owners || 'Owners'}</p>
                <p className="text-heading-4 text-neutral-900 font-bold">{community?.owners?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Join Requests (pending-approval review — work order §4) */}
        {isModerator && (
          <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-4 mb-6">
            <h2 className="flex items-center gap-2 text-heading-6 text-neutral-900 font-bold mb-3">
              <FaUserPlus size={18} className="text-primary-600" />
              {content.joinRequestsTitle || 'Pending Join Requests'}
              {pendingJoinRequests.length > 0 && (
                <span className="bg-primary-600 text-white text-caption px-2 py-0.5 rounded-full font-semibold">
                  {pendingJoinRequests.length}
                </span>
              )}
            </h2>

            {loadingJoinRequests ? (
              <p className="text-body-2 text-neutral-500">
                {content.loading?.value || 'Loading...'}
              </p>
            ) : pendingJoinRequests.length === 0 ? (
              <p className="text-body-2 text-neutral-500">
                {content.noJoinRequests || 'No pending join requests'}
              </p>
            ) : (
              <div className="space-y-2">
                {pendingJoinRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center gap-3 bg-neutral-50 rounded-lg border border-outline p-3"
                  >
                    {request.requester?.profilePicture ? (
                      <img
                        src={request.requester.profilePicture}
                        alt={request.requester?.username || 'User'}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center shrink-0 text-neutral-600 font-semibold">
                        {(request.requester?.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-2 text-neutral-900 truncate">
                        {request.requester?.fullName || request.requester?.username || 'Unknown user'}
                      </p>
                      <p className="text-caption text-neutral-500 truncate">
                        @{request.requester?.username || 'unknown'} ·{' '}
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDecideJoinRequest(request._id, 'approved')}
                        disabled={decideJoinRequestMutation.isPending}
                        className="px-4 py-2 rounded-full bg-primary-600 text-white text-button font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {content.approve || 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecideJoinRequest(request._id, 'rejected')}
                        disabled={decideJoinRequestMutation.isPending}
                        className="px-4 py-2 rounded-full border border-outline text-neutral-700 text-button font-semibold hover:bg-surface-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {content.reject || 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-4 mb-6 space-y-4">
          {/* Role Filter */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-body-2 font-semibold text-neutral-700">
              {content.filterByRole || 'Filter by Role'}:
            </span>
            <div className="flex gap-2">
              {['all', 'member', 'moderator', 'owner'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg text-button font-medium transition-all ${
                    selectedRole === role
                      ? 'bg-primary-600 text-white shadow-elevation-1'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {role === 'all' ? content.all || 'All' : 
                   role === 'member' ? content.members || 'Members' :
                   role === 'moderator' ? content.moderators || 'Moderators' :
                   content.owners || 'Owners'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3">
            <label htmlFor="search" className="text-body-2 font-semibold text-neutral-700 whitespace-nowrap">
              {content.search || 'Search'}:
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={content.searchPlaceholder.value || 'Search by name or username...'}
              className="flex-1 px-4 py-2 bg-neutral-200 border border-neutral-300 rounded-lg text-body-1 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-button font-medium"
                aria-label="Clear search"
              >
                ✕ {content.clear || 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
          <h2 className="text-heading-5 text-neutral-900 font-semibold mb-4 flex items-center gap-2">
            <FaUsers size={20} className="text-primary-600" />
            {content.membersManagement || 'Members Management'}
            <span className="text-caption text-neutral-600 font-normal">
              ({members.length} {content.shown || 'shown'})
            </span>
          </h2>

          {loadingMembers && members.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : membersError ? (
            <div className="text-center py-8 text-error">
              {content.errorLoadingMembers || 'Error loading members'}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-neutral-600">
              {content.noMembers || 'No members found'}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-4 bg-neutral-200 rounded-lg hover:bg-neutral-300 transition-colors"
                >
                  {/* Clickable Area */}
                  <div 
                    onClick={() => handleMemberClick(member.username)}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-neutral-300 flex items-center justify-center shrink-0">
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={member.fullName || member.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-lg font-bold">
                          {(member.fullName || member.username)?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-1 font-semibold text-neutral-900 truncate">
                        {member.fullName || member.username}
                      </p>
                      <p className="text-caption text-neutral-600">@{member.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip
                          size="xs"
                          dot={false}
                          tone={
                            member.role === 'owner'
                              ? 'border-transparent bg-error-100 text-error-700'
                              : member.role === 'moderator'
                                ? 'border-transparent bg-secondary-100 text-secondary-700'
                                : 'border-transparent bg-neutral-300 text-neutral-700'
                          }
                        >
                          {member.role === 'owner' ? '👑 ' : member.role === 'moderator' ? '🛡️ ' : ''}
                          {member.role}
                        </Chip>
                        <span className="text-caption text-neutral-500">
                          {content.joined || 'Joined'}: {new Date(member.joinedAt).toLocaleDateString('ar-EG', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Moderator/Owner) */}
                  {isModerator && member.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      {/* Promote/Demote Moderator (Owner Only) */}
                      {isOwner && (
                        member.role === 'member' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddModerator(member._id);
                            }}
                            disabled={addModeratorMutation.isPending}
                            className="flex items-center gap-2 px-3 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-button"
                            title={content.makeModerator}
                          >
                            <AiOutlineUserAdd size={16} />
                            <span className="hidden lg:inline">{content.makeModerator || 'Make Moderator'}</span>
                          </button>
                        ) : member.role === 'moderator' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveModerator(member._id);
                            }}
                            disabled={removeModeratorMutation.isPending}
                            className="flex items-center gap-2 px-3 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-button"
                            title={content.removeModerator}
                          >
                            <FaUserMinus size={14} />
                            <span className="hidden lg:inline">{content.removeModerator || 'Remove Moderator'}</span>
                          </button>
                        ) : null
                      )}

                      {/* Kick Member (Moderator/Owner) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToKick(member);
                          setShowKickConfirm(true);
                        }}
                        disabled={kickMemberMutation.isPending || (member.role === 'moderator' && !isOwner)}
                        className="flex items-center gap-2 px-3 py-2 bg-error text-white rounded-lg hover:bg-error/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-button"
                        title={content.kickMember || 'Remove from Community'}
                      >
                        <FaUserMinus size={14} />
                        <span className="hidden lg:inline">{content.kickMember || 'Kick'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Infinite Scroll Trigger */}
              {hasNextPage && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-neutral-600">
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-body-2">{content.loadingMore || 'Loading more...'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kick Confirm Dialog */}
      <ConfirmDialog
        isOpen={showKickConfirm}
        onClose={() => {
          setShowKickConfirm(false);
          setMemberToKick(null);
        }}
        onConfirm={() => {
          if (memberToKick) {
            handleKickMember(memberToKick._id);
            setShowKickConfirm(false);
            setMemberToKick(null);
          }
        }}
        title={content.kickMember || 'Remove from Community'}
        message={content.confirmKick || 'Are you sure you want to remove this member from the community?'}
        variant="danger"
      />
    </div>
  );
};

export default CommunityManagement;
