import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntlayer, useLocale } from 'react-intlayer';
import { 
  FiHeart, 
  FiMessageCircle, 
  FiRepeat, 
  FiUserPlus,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
import { formatNotificationTime } from '../../utils/notificationHelpers';

/**
 * @fileoverview Single notification item component
 * Displays notification with actor avatar, message, and actions
 */

/**
 * Maps notification types to their corresponding icons
 */
const NOTIFICATION_ICONS = {
  like: FiHeart,
  comment: FiMessageCircle,
  comment_like: FiHeart,
  reply: FiMessageCircle,
  repost: FiRepeat,
  follow: FiUserPlus,
  enrollment_request: FiUserPlus,
  enrollment_approved: FiUserCheck,
  enrollment_rejected: FiUserX,
  group_join_request: FiUserPlus,
  group_join_approved: FiUserCheck,
  group_join_rejected: FiUserX,
};

/**
 * Single Notification Item Component
 * 
 * Features:
 * - Visual indicators for unread notifications
 * - Type-specific icons (like, comment, repost, follow)
 * - Actor grouping for multiple actors (e.g., "John and 2 others liked your post")
 * - Relative time display (e.g., "2 hours ago")
 * - Click navigation to related content
 * - Mark as read action with optimistic updates
 * 
 * @param {Object} props
 * @param {Object} props.notification - Notification object from API
 * @param {Function} props.onMarkAsRead - Callback to mark notification as read
 * @param {Function} [props.onNavigate] - Optional callback when notification is clicked (for additional side effects)
 * @param {Object} props.inFlight - In-flight state for this notification
 */
export const NotificationItem = ({ notification, onMarkAsRead, onNavigate, inFlight = {} }) => {
  const navigate = useNavigate();
  const content = useIntlayer('notificationsCenter');
  const {locale} = useLocale();
  
  const {
    _id,
    type,
    actor,
    actorCount = 1,
    target,
    isRead,
    updatedAt,
  } = notification;

  // Get icon component for notification type
  const IconComponent = NOTIFICATION_ICONS[type] || FiHeart;

  // Handle notification click - navigate based on type
  const handleClick = () => {
    // Mark as read when clicked
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(_id);
    }

    // Call onNavigate callback if provided (for additional side effects)
    if (onNavigate) {
      onNavigate(notification);
    }

    // Navigate based on notification type
    if (type === 'follow' && actor) {
      navigate(`/profile/${actor.username}`);
    } else if (
      ['enrollment_request', 'enrollment_approved', 'enrollment_rejected'].includes(type) &&
      target
    ) {
      // Enrollment flow notifications point at the track (target = Track)
      const trackId = target._id || target;
      navigate(`/tracks/${trackId}`);
    } else if (
      ['group_join_request', 'group_join_approved', 'group_join_rejected'].includes(type) &&
      target
    ) {
      // Community-group join flow notifications point at the communities page
      // (target = CommunityGroup; no per-group detail route exists yet)
      navigate('/communities');
    } else if (type === 'repost' && target) {
      // For reposts, navigate to the repost itself (the notification target IS the repost)
      const repostId = target._id || target;
      navigate(`/posts/${repostId}`);
    } else if (type === 'comment' && target) {
      // Navigate to post with comment highlighted
      const commentId = target._id || target;
      const postId = target.post || target._id;
      navigate(`/posts/${postId}#comment-${commentId}`);
    } else if (type === 'comment_like' && target) {
      // Navigate to post with comment highlighted
      const commentId = target._id || target;
      const postId = target.post;
      if (postId) {
        navigate(`/posts/${postId}#comment-${commentId}`);
      }
    } else if (type === 'reply' && target) {
      // Navigate to post with comment highlighted
      const commentId = target._id || target;
      const postId = target.post;
      if (postId) {
        navigate(`/posts/${postId}#comment-${commentId}`);
      }
    } else if (type === 'like' && target) {
      // For likes, navigate to the post
      const postId = target._id || target;
      navigate(`/posts/${postId}`);
    }
  };

  // Memoize formatted time to avoid recalculation
  const formattedTime = useMemo(
    () => formatNotificationTime(updatedAt, content, locale),
    [updatedAt, content, locale]
  );

  // Construct actor display text
  const actorText = useMemo(() => {
    if (!actor) return content.unknownUser;
    
    const actorName = actor.fullName || actor.username || content.unknownUser;
    
    if (actorCount === 1) {
      return actorName;
    } else if (actorCount === 2) {
      // Use i18n function with parameters
      return content.actorGroupingTwo[locale]({ 
        actor1: actorName, 
        actor2: content.oneOther.value
      });
    } else {
      // Use i18n function with parameters
      return content.actorGroupingMultiple[locale]({ 
        actor1: actorName, 
        count: actorCount - 1 
      });
    }
  }, [actor, actorCount, content, locale]);

  // Construct notification message using i18n
  const notificationMessage = useMemo(() => {
    const notificationTypes = content.notificationTypes;
    
    if (!notificationTypes) {
      return content.defaultInteraction;
    }

    // Note: We don't pass actor name here since it's displayed separately
    // The {{actor}} placeholder in the i18n string is just removed
    switch (type) {
      case 'like':
        return notificationTypes.like[locale]({ actor: '' })
      case 'comment':
        return notificationTypes.comment[locale]({ actor: '' })
      case 'comment_like':
        return notificationTypes.comment_like[locale]({ actor: '' })
      case 'reply':
        return notificationTypes.reply[locale]({ actor: '' })
      case 'repost':
        return notificationTypes.repost[locale]({ actor: '' })
      case 'follow':
        return notificationTypes.follow[locale]({ actor: '' })
      case 'enrollment_request':
        return notificationTypes.enrollment_request[locale]({ actor: '' })
      case 'enrollment_approved':
        return notificationTypes.enrollment_approved[locale]({ actor: '' })
      case 'enrollment_rejected':
        return notificationTypes.enrollment_rejected[locale]({ actor: '' })
      case 'group_join_request':
        return notificationTypes.group_join_request[locale]({ actor: '' })
      case 'group_join_approved':
        return notificationTypes.group_join_approved[locale]({ actor: '' })
      case 'group_join_rejected':
        return notificationTypes.group_join_rejected[locale]({ actor: '' })
      default:
        return content.defaultInteraction;
    }
  }, [type, content, locale]);

  // Truncate post content preview
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get display content based on notification type
  const displayContent = useMemo(() => {
    if (type === 'repost' && target) {
      // For reposts, show the repost comment if available
      return target.repostComment || target.content;
    }
    // For other types, show the target content
    return target?.content;
  }, [type, target]);

  return (
    <div
      className={`relative flex gap-3 p-4 border-b border-outline last:border-b-0 transition-colors duration-200 cursor-pointer hover:bg-neutral-200/40 ${
        !isRead ? 'bg-primary-50/60' : 'bg-transparent'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${actorText} ${notificationMessage}`}
    >
      {/* Actor Avatar */}
      <div className="relative w-12 h-12 shrink-0 self-start">
        <img
          src={actor?.profilePicture || '/default-avatar.png'}
          alt={actor?.fullName || actor?.username || 'User'}
          className="w-12 h-12 rounded-full object-cover"
        />
        
        {/* Notification Type Icon Badge */}
        <div 
          className="absolute -bottom-1 ltr:-right-1 rtl:-left-1 w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-neutral-50"
          style={{
            backgroundColor: 
              type === 'like' || type === 'comment_like' ? '#ef4444' :
              type === 'comment' || type === 'reply' ? '#3b82f6' :
              type === 'repost' ? '#22c55e' :
              type === 'follow' ? '#a855f7' : '#64748b'
          }}
        >
          <IconComponent className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Notification Content */}
      <div className="flex-1 min-w-0">
        {/* Actor Names and Action */}
        <p className="text-body-2 line-clamp-2 break-words">
          <span className="font-semibold text-primary-700">{truncateText(String(actorText), 60)}</span>
          {' '}
          <span className="text-neutral-600">{truncateText(String(notificationMessage), 120)}</span>
        </p>

        {/* Post Preview (if applicable) */}
        {displayContent && (
          <p className="mt-1 text-body-2 text-neutral-500 line-clamp-2">
            "{truncateText(displayContent, 50)}"
          </p>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-caption text-neutral-400 font-medium">
          {formattedTime}
        </p>
      </div>

      {/* Mark as Read Button (only shown if unread) */}
      {!isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigation when clicking mark as read
            onMarkAsRead(_id);
          }}
          disabled={inFlight.markRead}
          title={content.markAsRead?.value || 'Mark as read'}
          aria-label={content.markAsRead?.value || 'Mark as read'}
          className="shrink-0 self-start mt-1 w-3 h-3 rounded-full bg-primary-500 hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        />
      )}
    </div>
  );
};

export default NotificationItem;
