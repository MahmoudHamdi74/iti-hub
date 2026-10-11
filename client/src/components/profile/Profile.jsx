import { useParams } from 'react-router-dom';
import { useAuthStore } from '@store/auth';
import { useGetUserProfile, useGetUserPosts } from '@hooks/queries/useUserQueries';
import { useIntlayer } from 'react-intlayer';
import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';
import ProfilePosts from './ProfilePosts';

const Profile = () => {
  const { username } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const content = useIntlayer('profile');
  // console.log(content);

  // جلب بيانات المستخدم
  const { data: profileData, isLoading, error } = useGetUserProfile(username);

  const { data: postsData } = useGetUserPosts(profileData?.data?.isBlocked ? undefined : profileData?.data?._id);
  const total = postsData?.data?.pagination?.total;

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">{content.loadingProfile}</p>
        </div>
      </div>
    );
  }

  // Error State or User Not Found
  if (error || !profileData?.data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-neutral-50 shadow-lg rounded-lg p-12 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              {content.userNotFound}
            </h2>
            <p className="text-neutral-600 mb-6">
              @{username} {content.userNotFoundMessage}
            </p>
            {error && (
              <p className="text-sm text-neutral-500 mb-4">
                {error.message}
              </p>
            )}
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profile = profileData.data;
  const isOwnProfile = profile?.isOwnProfile || currentUser?._id === profile?._id;

  // Debug: Check if isBlocked is being received
  // console.log('Profile data:', { 
  //   username: profile?.username, 
  //   isBlocked: profile?.isBlocked,
  //   isOwnProfile,
  //   fullProfile: profile
  // });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto py-6">
        {/* Profile Header Section */}
        <ProfileHeader 
          profile={profile}
          isOwnProfile={isOwnProfile}
        />

        {/* Show blocked message if user is blocked */}
        {profile?.isBlocked ? (
          <div className="bg-neutral-50 shadow-sm rounded-lg p-12 mt-4">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-3">
                {content.userBlocked}
              </h3>
              <p className="text-lg text-neutax-w-md leading-relaxed">
                {content.userBlockedMessage}
              </p>
            </div>
          </div>
        ) : (
          // Only show Profile Info and Posts if user is NOT blocked
          <>
            {/* Profile Info Section */}
            <ProfileInfo profile={{ ...profile, postsCount: Number.isFinite(total) ? total : undefined }} />

            {/* Profile Posts Section */}
            <ProfilePosts 
              userId={profile._id}
              isOwnProfile={isOwnProfile}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
