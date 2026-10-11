import { FaFileAlt } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useIntlayer } from 'react-intlayer';
import { useGetUserPosts } from '@hooks/queries/useUserQueries';
import {PostCard} from '@components/post/PostCard';

const ProfilePosts = ({ userId, isOwnProfile }) => {
  const content = useIntlayer('profile');
  // جلب البوستات من الـ API باستخدام userId
  const { data: postsData, isLoading } = useGetUserPosts(userId);
  const posts = postsData?.data?.posts || [];
  // console.log('User Posts:', posts);

  if (isLoading) {
    return (
      <div className="bg-neutral-50 shadow-sm rounded-lg p-12">
        <div className="flex flex-col items-center justify-center">
          <AiOutlineLoading3Quarters className="w-10 h-10 text-primary-600 animate-spin mb-4" />
          <p className="text-neutral-600">{content.loadingPosts}</p>
        </div>
      </div>
    );
  }

  // No Posts State
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-neutral-50 shadow-sm rounded-lg p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <FaFileAlt className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {content.noPostsYet}
          </h3>
          <p className="text-neutral-600 max-w-sm">
            {isOwnProfile
              ? content.noPostsYetOwnMessage
              : content.noPostsYetOthersMessage}
          </p>
          {isOwnProfile && (
            <button className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
              {content.createFirstPost}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Posts Grid/List
  return (
    <div className="space-y-4">
      {/* Posts Header */}
      <div className="bg-neutral-50 shadow-sm rounded-lg px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {content.posts} ({postsData?.data?.pagination?.total ?? posts.length})
        </h2>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};



// Helper function to format date


export default ProfilePosts;
