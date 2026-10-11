import { useIntlayer } from 'react-intlayer';
import useFeedFollowing from '@hooks/queries/useFeedFollowing';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import { PostCard } from '@components/post/PostCard';
import FeedPostSkeleton from '@components/feed/FeedPostSkeleton';
import EmptyFeed from '@components/feed/EmptyFeed';
import { Loading, ErrorDisplay } from '@components/common';

/**
 * Following feed controller - shows posts from users you follow
 */
export default function FeedFollowingController() {
  const  content  = useIntlayer('feedHome');

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isError,
    error,
    refetch,
    isFetchingNextPage 
  } = useFeedFollowing();

  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage
  });

  const posts = data?.pages.flatMap(page => page.data.posts) ?? [];

  if (isLoading) {
    return (
      <div className="w-full min-w-0">
        <FeedPostSkeleton />
        <FeedPostSkeleton />
        <FeedPostSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-w-0">
        <ErrorDisplay 
          message={error?.response?.data?.error?.message || content.errorLoadingFeed}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="w-full min-w-0">
        <EmptyFeed 
          title={content.noFollowingPostsTitile}
          message={content.noFollowingPosts}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex flex-col gap-3">
      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
        />
      ))}

      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <Loading />}
      </div>
    </div>
  );
}
