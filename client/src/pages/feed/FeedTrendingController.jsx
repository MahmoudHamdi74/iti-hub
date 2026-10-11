import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import useFeedTrending from '@hooks/queries/useFeedTrending';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import { PostCard } from '@components/post/PostCard';
import FeedPostSkeleton from '@components/feed/FeedPostSkeleton';
import EmptyFeed from '@components/feed/EmptyFeed';
import TimeframeSelector from '@components/feed/TimeframeSelector';
import { Loading, ErrorDisplay } from '@components/common';

/**
 * Trending feed controller - shows trending posts with timeframe filter
 */
export default function FeedTrendingController() {
  const  content  = useIntlayer('feedHome');
  const [timeframe] = useState('24h');

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isError,
    error,
    refetch,
    isFetchingNextPage 
  } = useFeedTrending(timeframe);

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

  return (
    <div className="w-full min-w-0 flex flex-col gap-3">
      
      {posts.length === 0 ? (
        <EmptyFeed 
          title={content.noTrendingPostsTitle}
          message={content.noTrendingPosts}
        />
      ) : (
        <>
          {posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
            />
          ))}

          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && <Loading />}
          </div>
        </>
      )}
    </div>
  );
}
