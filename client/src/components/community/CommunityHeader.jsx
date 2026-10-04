import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaUserPlus, FaUserMinus, FaShieldAlt } from 'react-icons/fa';
import { FiSettings } from 'react-icons/fi';
import { HiPencil, HiOutlineClock } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import useRequireAuth from '@hooks/useRequireAuth';
import Button from '@components/common/Button';
import PostComposerModal from '@components/post/PostComposerModal';

/**
 * CommunityHeader Component - Part 1
 * Displays community cover image, profile picture, and action buttons
 *
 * Round 3 work order §4: the Join button now goes through the
 * pending-request flow — three visual states:
 *   not joined      → "Request to Join" (sends a join request)
 *   request pending → "Request Pending" (clock icon, cancel via tooltip action)
 *   joined          → "Leave Community"
 */
const CommunityHeader = ({
  community,
  isJoined,
  isPending,
  isJoining,
  onJoinLeave,
  onProfilePictureUpdate,
  onCoverImageUpdate,
}) => {
  const  content  = useIntlayer('community');
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const isOwner = community?.role === 'owner' || false;
  const isModerator = community?.role === 'moderator' || community?.role === 'owner' || false;

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onProfilePictureUpdate(file);
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCoverImageUpdate(file);
    }
  };

  // Handle join/leave with auth check
  const handleJoinLeave = () => {
    requireAuth(() => {
      onJoinLeave();
    });
  };

  // Handle create post with auth check
  const handleCreatePost = () => {
    requireAuth(() => setShowComposer(true));
  };

  return (
    <div className="bg-neutral-100 shadow-elevation-2">
      {/* Cover Image Section */}
      <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-r from-primary-500 to-secondary-500 overflow-hidden">
        {community.coverImage ? (
          <img
            src={community.coverImage}
            alt={`${community.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-heading-1 opacity-50">
              {community.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Cover Image Update Button (Owner Only) */}
        {isOwner && (
          <>
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-4 right-4 bg-neutral-900 bg-opacity-70 hover:bg-opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-elevation-2"
            >
              <FaCamera size={20} />
              <span className="text-button">{content.changeCoverImage}</span>
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 pb-6">
          {/* Profile Picture */}
          <div className="relative -mt-16 md:-mt-20">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-neutral-50 shadow-elevation-3 overflow-hidden bg-primary-100">
              {community.profilePicture ? (
                <img
                  src={community.profilePicture}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                  <span className="text-white text-4xl font-bold">
                    {community.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Picture Update Button (Owner Only) */}
            {isOwner && (
              <>
                <button
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-neutral-100 hover:bg-neutral-200 p-2 rounded-full shadow-elevation-2 transition-all"
                  title={content.changeProfilePicture}
                >
                  <FaCamera size={20} className="text-neutral-700" />
                </button>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Community Info & Actions */}
          <div className="w-full min-w-0 flex-1 flex flex-col md:flex-row md:flex-wrap md:items-end justify-between gap-4 pt-4 md:pt-0">
            {/* Community Name & Stats */}
            <div>
              <h1 className="text-heading-2 text-neutral-900 font-bold mb-2 break-words">
                {community.name}
              </h1>
              <div className="flex items-center gap-4 text-body-2 text-neutral-600">
                <span>{community.memberCount || 0} {content.members}</span>
                <span>•</span>
                <span>{community.postCount || 0} {content.posts}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Create Post Button - Available for all joined members */}
              {isJoined && (
                <Button
                  onClick={handleCreatePost}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <HiPencil size={18} />
                  <span>{content.createPost}</span>
                </Button>
              )}

              {/* Join/Leave Button (pending-request flow — work order §4) */}
              {!isOwner && !isJoined && isPending && (
                <button
                  type="button"
                  disabled
                  title={content.requestPendingHint?.value}
                  className="px-6 py-2.5 rounded-lg text-button font-semibold bg-neutral-200 text-neutral-500 flex items-center gap-2 cursor-not-allowed"
                >
                  <HiOutlineClock size={18} />
                  <span>{content.requestPending?.value || 'Request Pending'}</span>
                </button>
              )}
              {!isOwner && !isJoined && !isPending && (
                <button
                  onClick={handleJoinLeave}
                  disabled={isJoining}
                  className="px-6 py-2.5 rounded-lg text-button font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-elevation-1 hover:shadow-elevation-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? (
                    <>
                      <HiOutlineClock size={18} className="animate-spin" />
                      <span>{content.loading?.value || 'Loading...'}</span>
                    </>
                  ) : (
                    <>
                      <FaUserPlus size={18} />
                      <span>{content.requestToJoin?.value || content.joinCommunity}</span>
                    </>
                  )}
                </button>
              )}
              {isJoined && (
                <button
                  onClick={handleJoinLeave}
                  className="px-6 py-2.5 rounded-lg text-button font-semibold bg-neutral-200 text-neutral-700 hover:bg-neutral-300 transition-all shadow-elevation-1 hover:shadow-elevation-2 flex items-center gap-2"
                >
                  <FaUserMinus size={18} />
                  <span>{content.leaveCommunity}</span>
                </button>
              )}

              {/* Settings Button (Owner/Moderator Only) */}
              {(isOwner || isModerator) && (
                <>
                  <button
                    onClick={() => navigate(`/community/${community._id}/manage`)}
                    className="px-6 py-2.5 rounded-lg text-button font-semibold bg-secondary-600 text-white hover:bg-secondary-700 transition-all shadow-elevation-1 hover:shadow-elevation-2 flex items-center gap-2"
                  >
                    <FaShieldAlt size={18} />
                    <span>{content.manage}</span>
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-6 py-2.5 rounded-lg text-button font-semibold bg-neutral-200 text-neutral-700 hover:bg-neutral-300 transition-all shadow-elevation-1 hover:shadow-elevation-2 flex items-center gap-2"
                  >
                    <FiSettings size={18} />
                    <span>{content.settings || 'Settings'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Composer Modal */}
      <PostComposerModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        initialCommunityId={community._id}
      />
    </div>
  );
};

export default CommunityHeader;
