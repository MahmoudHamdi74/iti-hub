import { FaUsers, FaUserCheck } from 'react-icons/fa';
import { useIntlayer } from 'react-intlayer';
import { useState } from 'react';
import FollowersList from './FollowersList';
import FollowingList from './FollowingList';

const ProfileInfo = ({ profile }) => {
  const content = useIntlayer('profile');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  
  if (!profile) {
    return null;
  }

  return (
    <>
      <div className="bg-neutral-50 shadow-sm rounded-lg p-4 sm:p-6 mb-4">
        {/* Bio Section */}
        {profile.bio && (
          <div className="mb-6">
            <p className="text-neutral-800 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-1 sm:gap-3 pt-4 border-t border-neutral-200">
          {/* Followers */}
          <button 
            onClick={() => setShowFollowers(true)}
            className="flex min-w-0 flex-col sm:flex-row items-center gap-2 group hover:bg-neutral-50 px-1 sm:px-3 py-2 rounded-lg transition-colors"
          >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            <FaUsers className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-center sm:text-start min-w-0">
            <p className="text-2xl font-bold text-neutral-900">
              {formatNumber(profile.followersCount || 0)}
            </p>
            <p className="text-xs sm:text-sm break-words text-neutral-600">{content.followers}</p>
          </div>
        </button>

        {/* Following */}
        <button 
          onClick={() => setShowFollowing(true)}
            className="flex min-w-0 flex-col sm:flex-row items-center gap-2 group hover:bg-neutral-50 px-1 sm:px-3 py-2 rounded-lg transition-colors"
          >
          <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
            <FaUserCheck className="w-5 h-5 text-secondary-600" />
          </div>
          <div className="text-center sm:text-start min-w-0">
            <p className="text-2xl font-bold text-neutral-900">
              {formatNumber(profile.followingCount || 0)}
            </p>
            <p className="text-xs sm:text-sm break-words text-neutral-600">{content.followingCount}</p>
          </div>
        </button>

        {/* Posts Count (if available) */}
        {profile.postsCount !== undefined && (
          <div className="flex min-w-0 flex-col sm:flex-row items-center gap-2 px-1 sm:px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <div className="text-center sm:text-start min-w-0">
              <p className="text-2xl font-bold text-neutral-900">
                {formatNumber(profile.postsCount || 0)}
              </p>
              <p className="text-xs sm:text-sm break-words text-neutral-600">{content.posts}</p>
            </div>
          </div>
        )}
      </div>

      {/* Follows You Badge */}
      {profile.followsYou && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
            <FaUserCheck className="w-4 h-4" />
            Follows You
          </span>
        </div>
      )}
    </div>

    {/* Modals */}
    {showFollowers && (
      <FollowersList userId={profile._id} onClose={() => setShowFollowers(false)} />
    )}
    {showFollowing && (
      <FollowingList userId={profile._id} onClose={() => setShowFollowing(false)} />
    )}
  </>
  );
};

// Helper function to format numbers (e.g., 1.5K, 2.3M)
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

export default ProfileInfo;
