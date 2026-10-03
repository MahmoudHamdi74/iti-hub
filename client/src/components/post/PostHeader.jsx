import React from 'react';
import { HiArrowPathRoundedSquare } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/uiStore';
import { UserAvatar } from '@/components/user/UserAvatar';
import { UserInfo } from '@/components/user/UserInfo';
import { PostMenu } from './PostMenu';
import { TextContent } from '@/components/shared/TextContent';
import UnavailablePost from './UnavailablePost';

dayjs.extend(relativeTime);

/**
 * PostHeader - Unified header component for both regular posts and reposts
 * 
 * This component replaces the separate PostHeader and RepostHeader components,
 * providing a single source of truth with prop-based behavior.
 * 
 * @component
 * @example
 * // Regular post
 * <PostHeader
 *   post={post}
 *   onProfileClick={handleProfile}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onSave={handleSave}
 *   isSaved={false}
 * />
 * 
 * // Repost
 * <PostHeader
 *   post={repost}
 *   isRepost={true}
 *   onProfileClick={handleProfile}
 *   onEdit={handleEditRepost}
 *   onDelete={handleDeleteRepost}
 *   onSave={handleSave}
 *   isSaved={true}
 * />
 * 
 * // Repost with comment
 * <PostHeader
 *   post={repost}
 *   isRepost={true}
 *   repostComment="This is amazing!"
 *   onProfileClick={handleProfile}
 *   onEdit={handleEditRepost}
 *   onDelete={handleDeleteRepost}
 *   onSave={handleSave}
 *   isSaved={false}
 * />
 * 
 * @param {Object} props
 * @param {Object} props.post - The post object
 * @param {Function} props.onProfileClick - Handler for profile click
 * @param {boolean} [props.isRepost=false] - Whether this is a repost
 * @param {string} [props.repostComment] - Optional comment from reposter
 * @param {Function} [props.onEdit] - Handler for edit action (owner only)
 * @param {Function} [props.onDelete] - Handler for delete action (owner only)
 * @param {Function} props.onSave - Handler for save/unsave action
 * @param {boolean} [props.isSaved=false] - Whether post is saved by current user
 * @param {string} [props.className] - Additional CSS classes
 */
export function PostHeader({
  post,
  onProfileClick,
  isRepost = false,
  repostComment = null,
  onEdit,
  onDelete,
  onSave,
  isSaved = false,
  className = '',
}) {
  const { user } = useAuthStore();
  const { locale } = useUIStore();
  const content = useIntlayer('feed-post');
  
  // Set dayjs locale
  dayjs.locale(locale);

  if (!post?.author?._id) return <UnavailablePost variant="compact" />;
  const isOwnPost = Boolean(user?._id) && user._id === post.author._id;
  const showMenu = onEdit || onDelete || onSave; // Show menu if any action is available

  return (
    <div className={className}>
      {/* Repost Indicator (only for reposts) */}
      {isRepost && (
        <div className="flex items-center gap-2 text-body-2 text-neutral-600 mb-2">
          <HiArrowPathRoundedSquare className="w-4 h-4" />
          <button
            onClick={() => onProfileClick(post.author.username)}
            className="font-semibold hover:underline"
          >
            {post.author.fullName}
          </button>
          <span>{content.reposted}</span>
          <span>· {dayjs(post.createdAt).fromNow()}</span>
        </div>
      )}


      {/* Main Header (works for both regular posts and original posts in reposts) */}
      <div className="flex items-start gap-3">
        <UserAvatar
          src={post.author.profilePicture}
          alt={post.author.fullName}
          size="md"
          onClick={() => onProfileClick(post.author.username)}
        />

        <UserInfo
          fullName={post.author.fullName}
          username={post.author.username}
          timestamp={post.createdAt}
          edited={!!post.editedAt}
          onProfileClick={() => onProfileClick(post.author.username)}
        />

        {/* Post Menu - Shown if user has permissions */}
        {showMenu && (
          <PostMenu
            isOwnPost={isOwnPost}
            isSaved={isSaved}
            onSave={onSave}
            onEdit={isOwnPost ? onEdit : undefined}
            onDelete={onDelete}
          />
        )}

      </div>
      {/* Reposter's Comment (if repost with comment) */}
      {isRepost && repostComment && (
        <div className="mb-3">
          <TextContent content={repostComment} maxWords={100} />
        </div>
      )}
    </div>
  );
}
