import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@/store/auth';
import { PostHeader } from './PostHeader';
import { PostContent } from './PostContent';
import { PostInteractions } from './PostInteractions';
import ConfirmDialog from '@components/common/ConfirmDialog';
import UnavailablePost from './UnavailablePost';

/**
 * RepostContainer - Container component for reposts using unified PostHeader
 * 
 * Shows:
 * 1. Reposter header with menu (can edit/delete repost)
 * 2. Optional repost comment
 * 3. Original post card (nested, without menu)
 * 4. Interactions for the repost
 * 
 * @component
 * @example
 * <RepostContainer
 *   repost={repost}
 *   originalPost={originalPost}
 *   onPostClick={handlePostClick}
 * />
 * 
 * @param {Object} props
 * @param {Object} props.repost - The repost object
 * @param {Object} props.originalPost - The original post being reposted
 * @param {Function} [props.onPostClick] - Handler for post click navigation
 * @param {string} [props.className] - Additional CSS classes
 */
function AvailableRepostContainer({ repost, originalPost, onPostClick, className = '' }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const content = useIntlayer('repost-menu');

  // Local state for optimistic updates
  const [likeState, setLikeState] = useState({
    isLiked: repost.isLiked || false,
    likesCount: repost.likesCount || 0,
  });

  const [saveState, setSaveState] = useState({
    isSaved: repost.isSaved || false,
  });

  const [repostState] = useState({
    isReposted: repost.isReposted || false,
    repostsCount: repost.repostsCount || 0,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${repost._id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to like repost');
      return response.json();
    },
    onMutate: async () => {
      setLikeState((prev) => ({
        isLiked: !prev.isLiked,
        likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
      }));
    },
    onError: () => {
      setLikeState({
        isLiked: repost.isLiked || false,
        likesCount: repost.likesCount || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = saveState.isSaved ? 'unsave' : 'save';
      const response = await fetch(`/api/posts/${repost._id}/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to ${endpoint} repost`);
      return response.json();
    },
    onMutate: async () => {
      setSaveState((prev) => ({
        isSaved: !prev.isSaved,
      }));
    },
    onError: () => {
      setSaveState({
        isSaved: repost.isSaved || false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-posts']);
    },
  });

  // Delete mutation (for reposts)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${repost._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete repost');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  // Handlers
  const handleLike = useCallback(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    likeMutation.mutate();
  }, [user, navigate, likeMutation]);

  const handleSave = useCallback(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    saveMutation.mutate();
  }, [user, navigate, saveMutation]);

  const handleComment = useCallback(() => {
    if (onPostClick) {
      onPostClick(repost._id);
    } else {
      navigate(`/posts/${repost._id}`);
    }
  }, [repost._id, onPostClick, navigate]);

  const handleRepost = useCallback(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    // TODO: Implement instant repost
    console.log('Instant repost');
  }, [user, navigate]);

  const handleRepostWithComment = useCallback(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    // TODO: Open repost modal
    console.log('Repost with comment');
  }, [user, navigate]);

  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    console.log('Share repost');
  }, []);

  const handleEditRepost = useCallback(() => {
    // Edit the repost comment, not the original post
    // TODO: Open edit repost modal
    console.log('Edit repost comment');
  }, []);

  const handleDeleteRepost = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteRepost = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

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
      className={`bg-neutral-50 border border-neutral-200 rounded-lg hover:shadow-sm transition-shadow ${className}`}
    >
      {/* Reposter Header with Menu */}
      <div className="p-4">
        <PostHeader
          post={repost}
          isRepost={true}
          repostComment={repost.repostComment}
          onProfileClick={handleProfileClick}
          onEdit={user?._id === repost.author._id ? handleEditRepost : undefined}
          onDelete={user?._id === repost.author._id ? handleDeleteRepost : undefined}
          onSave={handleSave}
          isSaved={saveState.isSaved}
        />

        {/* Original Post Card (Nested, No Menu) */}
        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 mt-3">
          {/* Original Post Header - No menu, not editable */}
          <PostHeader
            post={originalPost}
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
              community={originalPost?.community}
              content={originalPost?.content}
              images={originalPost?.images}
              tags={originalPost?.tags}
              onCommunityClick={handleCommunityClick}
            />
          </div>
        </div>
      </div>

      {/* Interactions for the Repost */}
      <div className="px-4 pb-4">
        <PostInteractions
          likeCount={likeState.likesCount}
          commentCount={repost.commentsCount || 0}
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

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteRepost}
        title={content.confirmDeleteTitle}
        message={content.confirmDeleteMessage}
        variant="danger"
      />
    </article>
  );
}

export function RepostContainer(props) {
  if (!props.repost?.author?._id) return <UnavailablePost className={props.className} />;
  return <AvailableRepostContainer {...props} />;
}
