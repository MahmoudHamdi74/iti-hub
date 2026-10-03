import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';
import { HiHeart, HiOutlineHeart, HiEllipsisHorizontal, HiPencil, HiTrash } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { useUIStore } from '@store/uiStore';
import { useAuthStore } from '@store/auth';
import useRequireAuth from '@hooks/useRequireAuth';
import useCommentReplies from '@hooks/queries/useCommentReplies';
import useCreateComment from '@hooks/mutations/useCreateComment';
import useUpdateComment from '@hooks/mutations/useUpdateComment';
import useDeleteComment from '@hooks/mutations/useDeleteComment';
import useToggleCommentLike from '@hooks/mutations/useToggleCommentLike';
import CommentForm from './CommentForm';
import ConfirmDialog from '@components/common/ConfirmDialog';

dayjs.extend(relativeTime);

/**
 * Individual comment item with replies support
 * @param {Object} props
 * @param {Object} props.comment - Comment object
 * @param {string} props.postId - Post ID
 * @param {Function} props.onReply - Reply button handler
 * @param {boolean} props.isReplyFormOpen - Reply form visibility
 * @param {Function} props.onCancelReply - Cancel reply handler
 */
export default function CommentItem({ 
  comment, 
  postId, 
  onReply, 
  isReplyFormOpen,
  onCancelReply,
  authorId
}) {
  const navigate = useNavigate();
  const { locale } = useUIStore();
  const { user } = useAuthStore();
  const { requireAuth } = useRequireAuth();
  const content = useIntlayer('commentForm');
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const toggleCommentLike = useToggleCommentLike();
  const authorName = comment.author?.fullName || (locale === 'ar' ? 'حساب محذوف' : 'Deleted account');
  const isOwnComment = Boolean(user?._id) && user._id === comment.author?._id;
  const isOwnPost = Boolean(user?._id) && user._id === authorId;

  // Local state for optimistic updates
  const [likeState, setLikeState] = useState({
    isLiked: comment.isLiked || false,
    count: comment.likesCount || 0,
  });

  // Set dayjs locale
  dayjs.locale(locale);

  // Fetch replies only when expanded
  const { data: repliesData } = useCommentReplies(postId, comment._id, {
    enabled: showReplies,
  });

  const replies = repliesData?.pages.flatMap(page => page.data.comments) ?? [];

  const handleProfileClick = (username) => {
    if (!username) return;
    navigate(`/profile/${username}`);
  };

  const handleReplySubmit = (content) => {
    createComment.mutate(
      { 
        postId, 
        content, 
        parentCommentId: comment._id 
      },
      {
        onSuccess: () => {
          onCancelReply();
          setShowReplies(true); // Auto-expand replies after posting
        },
      }
    );
  };

  const handleLike = () => {
    requireAuth(() => {
      const currentLiked = likeState.isLiked;
      const currentCount = likeState.count;

      // Optimistic update
      setLikeState({
        isLiked: !currentLiked,
        count: currentLiked ? currentCount - 1 : currentCount + 1,
      });

      toggleCommentLike.mutate(
        { commentId: comment._id, isCurrentlyLiked: currentLiked },
        {
          onError: () => {
            // Rollback on error
            setLikeState({
              isLiked: currentLiked,
              count: currentCount,
            });
            toast.error('Failed to like comment');
          }
        }
      );
    });
  };

  const handleReplyLike = (reply) => {
    requireAuth(() => {
      const currentLiked = reply.isLiked;
      
      toggleCommentLike.mutate(
        { commentId: reply._id, isCurrentlyLiked: currentLiked },
        {
          onError: () => {
            toast.error('Failed to like reply');
          }
        }
      );
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleUpdateComment = () => {
    if (!editContent.trim()) {
      toast.error(content.contentRequired);
      return;
    }

    if (editContent.length > 5000) {
      toast.error(content.contentTooLong);
      return;
    }

    updateComment.mutate(
      { commentId: comment._id, content: editContent },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success(content.commentUpdated || 'Comment updated');
        },
        onError: () => {
          toast.error(content.updateFailed || 'Failed to update comment');
        },
      }
    );
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteComment.mutate(
      { commentId: comment._id },
      {
        onSuccess: () => {
          toast.success(content.commentDeleted || 'Comment deleted');
        },
        onError: () => {
          toast.error(content.deleteFailed || 'Failed to delete comment');
        },
      }
    );
  };

  return (
    <div className="flex gap-3" id={`comment-${comment._id}`}>
      <img
        src={comment.author?.profilePicture || "/default-avatar.png"}
        alt={authorName}
        className="w-8 h-8 rounded-full cursor-pointer object-cover shrink-0"
        onClick={() => handleProfileClick(comment.author?.username)}
      />
      <div className="flex-1 min-w-0">
        <div className="bg-neutral-50 rounded-lg p-3 shadow-elevation-1">
          <div className="flex items-start justify-between">
            <button
              onClick={() => handleProfileClick(comment.author?.username)}
              className="text-body-2 font-semibold hover:underline"
            >
              {authorName}
            </button>

            {/* Edit/Delete Menu */}
            {(isOwnComment || isOwnPost) && !isEditing && (
              <Menu as="div" className="relative">
                <MenuButton className="p-1 rounded-full hover:bg-neutral-100 transition-colors">
                  <HiEllipsisHorizontal className="w-4 h-4 text-neutral-600" />
                </MenuButton>
                <MenuItems
                  anchor="bottom end"
                  className="w-40 bg-neutral-50 rounded-lg shadow-elevation-2 border border-neutral-200 py-1 z-50 [--anchor-gap:4px]"
                >
                  {isOwnComment && (
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={handleEdit}
                          className={`w-full px-4 py-2 text-start text-body-2 flex items-center gap-3 ${
                            focus ? "bg-neutral-50" : ""
                          }`}
                        >
                          <HiPencil className="w-4 h-4" />
                          <span>{content.editComment}</span>
                        </button>
                      )}
                    </MenuItem>
                  )}
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={handleDelete}
                        className={`w-full px-4 py-2 text-start text-body-2 flex items-center gap-3 text-red-600 ${
                          focus ? "bg-neutral-50" : ""
                        }`}
                      >
                        <HiTrash className="w-4 h-4" />
                        <span>{content.deleteComment}</span>
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 text-body-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                maxLength={5000}
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={updateComment.isPending}
                  className="px-3 py-1 text-caption text-neutral-700 hover:bg-neutral-100 rounded transition-colors disabled:opacity-50"
                >
                  {content.cancel}
                </button>
                <button
                  onClick={handleUpdateComment}
                  disabled={updateComment.isPending || !editContent.trim()}
                  className="px-3 py-1 text-caption bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateComment.isPending ? content.saving : content.save}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-body-2 text-neutral-900 mt-1 whitespace-pre-wrap wrap-break-word">
              {comment.content}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1 text-caption text-neutral-600">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${
              likeState.isLiked ? "text-red-600" : "hover:text-red-600"
            }`}
            aria-label={likeState.isLiked ? content.liked : content.like}
          >
            {likeState.isLiked ? content.liked : content.like}
            {likeState.count > 0 && <span>{likeState.count}</span>}
          </button>
          <button onClick={onReply} className="hover:text-primary-600">
            {content.reply}
          </button>
          <span>{dayjs(comment.createdAt).fromNow()}</span>
          {comment.editedAt && <span>({content.edited})</span>}
        </div>

        {/* Reply form */}
        {isReplyFormOpen && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              parentCommentId={comment._id}
              onSubmit={handleReplySubmit}
              onCancel={onCancelReply}
              placeholder={`Reply to ${authorName}...`}
            />
          </div>
        )}

        {/* Collapsed replies button */}
        {comment.repliesCount > 0 && !showReplies && (
          <button
            onClick={() => setShowReplies(true)}
            className="mt-2 text-caption text-primary-600 hover:underline"
          >
            {content.view} {comment.repliesCount}{" "}
            {comment.repliesCount === 1 ? content.reply : content.replies}
          </button>
        )}

        {/* Expanded replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-3 space-y-3 ms-4 border-s-2 border-neutral-200 ps-4">
            {replies.map((reply) => (
              <div key={reply._id} className="flex gap-2">
                <img
                  src={reply.author?.profilePicture || "/default-avatar.png"}
                  alt={reply.author?.fullName || (locale === 'ar' ? 'حساب محذوف' : 'Deleted account')}
                  className="w-6 h-6 rounded-full cursor-pointer object-cover shrink-0"
                  onClick={() => handleProfileClick(reply.author?.username)}
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-neutral-50 rounded-lg p-2 shadow-elevation-1">
                    <button
                      onClick={() => handleProfileClick(reply.author?.username)}
                      className="text-caption font-semibold hover:underline"
                    >
                      {reply.author?.fullName || (locale === 'ar' ? 'حساب محذوف' : 'Deleted account')}
                    </button>
                    <p className="text-caption text-neutral-900 mt-1 whitespace-pre-wrap wrap-break-word">
                      {reply.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-caption text-neutral-600">
                    <button
                      className="flex items-center gap-1 hover:text-red-600"
                      onClick={() => handleReplyLike(reply)}
                    >
                      {reply?.isLiked ? content.liked : content.like}
                      {reply.likesCount > 0 && <span>{reply.likesCount}</span>}
                    </button>
                    <span>{dayjs(reply.createdAt).fromNow()}</span>
                    {reply.editedAt && <span>({content.edited})</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hide replies button */}
        {showReplies && comment.repliesCount > 0 && (
          <button
            onClick={() => setShowReplies(false)}
            className="mt-2 text-caption text-neutral-600 hover:underline"
          >
            {content.hideReplies}
          </button>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={content.confirmDeleteTitle}
        message={content.confirmDeleteBody}
        variant="danger"
      />
    </div>
  );
}
