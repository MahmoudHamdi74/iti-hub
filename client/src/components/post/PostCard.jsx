import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@/store/auth';
import useRequireAuth from '@hooks/useRequireAuth';
import useToggleLike from '@hooks/mutations/useToggleLike';
import useToggleSave from '@hooks/mutations/useToggleSave';
import useRepost from '@hooks/mutations/useRepost';
import useDeletePost from '@hooks/mutations/useDeletePost';
import { PostHeader } from './PostHeader';
import { PostContent } from './PostContent';
import { PostInteractions } from './PostInteractions';
import PostComposerModal from './PostComposerModal';
import RepostComposerModal from './RepostComposerModal';
import CommentsSection from '@components/comments/CommentsSection';
import UnavailablePost from './UnavailablePost';
import ConfirmDialog from '@components/common/ConfirmDialog';

/**
 * PostCard - Main container component for posts with business logic
 * 
 * This component handles:
 * - State management (like, save, repost)
 * - API calls with optimistic updates
 * - Event handlers
 * - Composition of presentational components
 * 
 * @component
 * @example
 * <PostCard
 *   post={post}
 *   onPostClick={handlePostClick}
 * />
 * 
 * @param {Object} props
 * @param {Object} props.post - The post object
 * @param {Function} [props.onPostClick] - Handler for post click navigation
 * @param {string} [props.className] - Additional CSS classes
 */
const AvailablePostCard = React.memo(({ post, onPostClick, isCommentsExpanded = false, className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { requireAuth } = useRequireAuth();
  const content = useIntlayer('post-menu');

  // Hooks for mutations
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const repost = useRepost();
  const deletePost = useDeletePost();
  const isRepost = !!(post.originalPost || post.repostComment);

  // Check if user can delete/edit the post
  const canModifyPost = useCallback(() => {
    if (!user) return false;
    
    // Post author can always modify
    if (user._id === post.author._id) return true;
    
    // Community moderators and owners can delete posts in their community
    if (post.community?.userRole) {
      // console.log("User is a community", post.community.userRole);
      const role = post.community.userRole;
      if (role === 'moderator' || role === 'owner') return true;
    }
    
    return false;
  }, [user, post.author._id, post.community]);


  // Local state for optimistic updates
  const [likeState, setLikeState] = useState({
    isLiked: post.isLiked || false,
    likesCount: post.likesCount || 0,
  });

  const [saveState, setSaveState] = useState({
    isSaved: post.isSaved || false,
  });

  const [repostState, setRepostState] = useState({
    isReposted: post.isReposted || false,
    repostsCount: post.repostsCount || 0,
  });

  // Modals
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComments, setShowComments] = useState(isCommentsExpanded);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Like mutation
  const handleLike = useCallback(() => {
    requireAuth(() => {
      const currentLiked = likeState.isLiked;
      const currentCount = likeState.likesCount;
      
      // Optimistic update
      setLikeState({
        isLiked: !currentLiked,
        likesCount: currentLiked ? currentCount - 1 : currentCount + 1,
      });

      toggleLike.mutate(
        { postId: post._id, isCurrentlyLiked: currentLiked },
        {
          onError: () => {
            // Rollback on error
            setLikeState({
              isLiked: currentLiked,
              likesCount: currentCount,
            });
            toast.error('Failed to like post');
          }
        }
      );
    });
  }, [requireAuth, post._id, likeState, toggleLike]);

  // Save mutation
  const handleSave = useCallback(() => {
    requireAuth(() => {
      const currentSaved = saveState.isSaved;
      
      // Optimistic update
      setSaveState({
        isSaved: !currentSaved,
      });

      toggleSave.mutate(
        { postId: post._id, isCurrentlySaved: currentSaved },
        {
          onSuccess: () => {
            toast.success(currentSaved ? 'Post unsaved' : 'Post saved');
          },
          onError: () => {
            // Rollback on error
            setSaveState({
              isSaved: currentSaved,
            });
            toast.error('Failed to save post');
          }
        }
      );
    });
  }, [requireAuth, post._id, saveState, toggleSave]);

  // Delete mutation
  const handleDelete = useCallback(() => {
    requireAuth(() => {
      setShowDeleteConfirm(true);
    });
  }, [requireAuth]);

  const confirmDelete = useCallback(() => {
    deletePost.mutate({
      postId: post._id,
      communityId: post.community?._id,
      authorId: post.author._id
    }, {
      onSuccess: () => {
        toast.success('Post deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete post');
      }
    });
  }, [post._id, post.community, post.author._id, deletePost]);

  const handleComment = useCallback(() => {
      if (onPostClick) {
        onPostClick(post._id);
      } else {
        // Toggle comments section
        setShowComments(prev => !prev);
      }
  }, [post._id, onPostClick]);

  const handleRepost = useCallback(() => {
    requireAuth(() => {
      const currentReposted = repostState.isReposted;
      const currentCount = repostState.repostsCount;
      
      // Optimistic update
      setRepostState({
        isReposted: true,
        repostsCount: currentCount + 1,
      });

      repost.mutate(
        { postId: post._id, comment: null },
        {
          onSuccess: () => {
            toast.success('Post reposted successfully');
          },
          onError: () => {
            // Rollback on error
            setRepostState({
              isReposted: currentReposted,
              repostsCount: currentCount,
            });
            toast.error('Failed to repost');
          }
        }
      );
    });
  }, [requireAuth, post._id, repostState, repost]);

  const handleRepostWithComment = useCallback(() => {
    requireAuth(() => {
      setShowRepostModal(true);
    });
  }, [requireAuth]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/posts/${post._id}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          toast.success('Link copied to clipboard');
        })
        .catch(() => {
          toast.error('Failed to copy link');
        });
    } else {
      toast.error('Failed to copy link');
    }
  }, [post._id]);

  const handleEdit = useCallback(() => {
    requireAuth(() => {
      setShowEditModal(true);
    });
  }, [requireAuth]);

  const handleProfileClick = useCallback(
    (username) => {
      navigate(`/profile/${username}`);
    },
    [navigate]
  );

  const handleCommunityClick = useCallback(
    (communityId) => {
      navigate(`/community/${communityId}`);
    },
    [navigate]
  );

  return (
    <article
      className={`bg-neutral-100 border border-outline rounded-2xl shadow-elevation-1 hover:shadow-elevation-2 transition-shadow overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <PostHeader
          post={post}
          isRepost={isRepost}
          repostComment={post.repostComment}
          onProfileClick={handleProfileClick}
          onEdit={user?._id === post.author._id ? handleEdit : undefined}
          onDelete={canModifyPost() ? handleDelete : undefined}
          onSave={handleSave}
          isSaved={saveState.isSaved}
        />

        {/* Original Post Container (for reposts) */}
        {isRepost && (
          <div className="border border-outline rounded-xl p-4 bg-neutral-50 mt-3">
            {post.originalPost && post.originalPost.author ? (
              <>
                {/* Original Post Header - No menu */}
                <PostHeader
                  post={post.originalPost}
                  isRepost={false}
                  onProfileClick={handleProfileClick}
                  onEdit={undefined}
                  onDelete={undefined}
                  onSave={undefined}
                  isSaved={false}
                />

                {/* Original Post Content */}
                <div className="mt-3">
                  <PostContent
                    community={post.originalPost.community}
                    content={post.originalPost.content}
                    images={post.originalPost.images}
                    tags={post.originalPost.tags}
                    onCommunityClick={handleCommunityClick}
                  />
                </div>
              </>
            ) : (
              /* Placeholder for deleted/unavailable post */
              <UnavailablePost/>
            )}
          </div>
        )}
      </div>

      {/* Content (only for non-reposts or reposts with additional content) */}
      {!isRepost && (
        <div className="px-5 pb-3">
          <PostContent
            community={post.community}
            content={post.content}
            images={post.images}
            tags={post.tags}
            onCommunityClick={handleCommunityClick}
          />
        </div>
      )}

      {/* Interactions */}
      <div className="px-5 pb-4 border-t border-outline pt-3 mx-0">
        <PostInteractions
          likeCount={likeState.likesCount}
          commentCount={post.commentsCount || 0}
          repostCount={repostState.repostsCount}
          isLiked={likeState.isLiked}
          isReposted={repostState.isReposted}
          onLike={handleLike}
          onComment={handleComment}
          onRepost={handleRepost}
          onRepostWithComment={handleRepostWithComment}
          onShare={handleShare}
        />
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentsSection 
          postId={post._id} 
          authorId={post.author._id}
          onClose={() => setShowComments(false)} 
        />
      )}

      {/* Modals */}
      <PostComposerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialPost={post}
      />

      <RepostComposerModal
        isOpen={showRepostModal}
        onClose={() => setShowRepostModal(false)}
        originalPost={post}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={content.confirmDeleteTitle}
        message={content.confirmDeleteMessage}
        variant="danger"
      />
    </article>
  );
});

AvailablePostCard.displayName = 'AvailablePostCard';

// Populated authors become null when an account is removed. Keep the guard
// outside the stateful component so transitions do not change hook order.
function PostCard(props) {
  if (!props.post?.author?._id) return <UnavailablePost className={props.className} />;
  return <AvailablePostCard {...props} />;
}

export { PostCard };
