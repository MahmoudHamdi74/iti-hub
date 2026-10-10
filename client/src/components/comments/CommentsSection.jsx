import { useState } from 'react';
import { HiXMark } from 'react-icons/hi2';
import usePostComments from '@hooks/queries/usePostComments';
import useCreateComment from '@hooks/mutations/useCreateComment';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { Loading } from '@components/common';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@/store/auth';

/**
 * Comments section that expands inline within feed posts
 * @param {Object} props
 * @param {string} props.postId - Post ID
 * @param {Function} props.onClose - Close handler
 */
export default function CommentsSection({ postId, onClose, authorId }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const t = useIntlayer('commentForm');
  const { isAuthenticated } = useAuthStore();
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading,
    isFetchingNextPage 
  } = usePostComments(postId);

  const createComment = useCreateComment();

  const comments = data?.pages.flatMap(page => page.data.comments) ?? [];

  const handleCommentSubmit = (content) => {
    return createComment.mutateAsync({ postId, content });
  };

  return (
    <div className="border-t border-neutral-200 bg-neutral-200">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
        <h3 className="text-heading-6 text-neutral-900">{t.title}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Close comments"
        >
          <HiXMark className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {/* Comment form */}
      {isAuthenticated && (
        <div className="p-4 bg-neutral-50 border-b border-neutral-200">
          <CommentForm
            postId={postId}
            onSubmit={handleCommentSubmit}
            placeholder="Write a comment..."
          />
        </div>
      )}

      {/* Comments list */}
      <div className="px-4 py-4 space-y-4 bg-neutral-100">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loading />
          </div>
        )}

        {!isLoading && comments.length === 0 && (
          <p className="text-center text-neutral-500 py-8 text-body-2">
            {t.noComments}
          </p>
        )}

        {comments.map(comment => (
          <CommentItem
            key={comment._id}
            comment={comment}
            postId={postId}
            authorId={authorId}
            onReply={() => setReplyingTo(comment._id)}
            isReplyFormOpen={replyingTo === comment._id && isAuthenticated}
            onCancelReply={() => setReplyingTo(null)}
          />
        ))}

        {/* Load more button */}
        {hasNextPage && (
          <div className="flex justify-center pt-2">
            <button 
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-primary-600 hover:underline text-body-2 font-medium disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more comments'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
