import { memo } from 'react';
import { UserAvatar } from '@/components/user/UserAvatar';
import { useIntlayer, useLocale } from 'react-intlayer';
import { useAuthStore } from '@store/auth';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';


dayjs.extend(relativeTime);

/**
 * @fileoverview Single conversation item in the messages list
 * Displays conversation preview with avatar, name, last message, and unread count
 * Memoized to prevent unnecessary re-renders when parent updates
 */

/**
 * ConversationItem - Displays a single conversation in the list
 * Memoized for performance - only re-renders when props change
 * 
 * @param {Object} props
 * @param {Object} props.conversation - Conversation data
 * @param {Function} props.onOpen - Callback when conversation is clicked
 * @param {boolean} [props.isActive=false] - Whether this conversation is currently open
 * @returns {JSX.Element}
 */
export const ConversationItem = memo(function ConversationItem({ conversation, onOpen, isActive = false }) {
  const content = useIntlayer('messagesList');
  const { locale } = useLocale();
  const currentUser = useAuthStore((state) => state.user);

  if (!conversation) return null;

  const {
    _id,
    isGroup,
    name,
    image,
    participants,
    lastMessage,
    unreadCount,
    updatedAt,
  } = conversation;

  // Determine display name and avatar
  let displayName = name;
  let displayAvatar = image;

  if (!isGroup && participants) {
    // Find the other participant (not current user)
    const otherParticipant = participants.find(
      (p) => p._id !== currentUser?._id
    );
    displayName = otherParticipant?.fullName || content.unknownUser.value;
    displayAvatar = otherParticipant?.profilePicture;
  }

  // Format last message preview
  const getMessagePreview = () => {
    if (!lastMessage) return '';

    const { content: messageContent, image: messageImage, senderId } = lastMessage;

    // Check if current user sent the message
    const isOwnMessage = senderId?._id === currentUser?._id;
    let prefix = (isOwnMessage ? content.you.value  : senderId?.fullName) + ': ';
    if (!senderId)
        prefix = content.initialMessage.value

    if (messageImage && !messageContent) {
      return `${prefix}${content.photoMessage.value}`;
    }

    return `${prefix}${messageContent || ''}`;
  };

  // Format relative time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const now = dayjs();
    const time = dayjs(timestamp);
    const diffInMinutes = now.diff(time, 'minute');
    const diffInHours = now.diff(time, 'hour');
    const diffInDays = now.diff(time, 'day');

    if (diffInMinutes < 1) return content.timeLabels.justNow.value;
    if (diffInMinutes < 60) return content.timeLabels.minutes[locale]({ count: diffInMinutes });
    if (diffInHours < 24) return content.timeLabels.hours[locale]({ count: diffInHours });
    if (diffInDays < 7) return content.timeLabels.days[locale]({ count: diffInDays });

    return time.format('MMM D');
  };

  const messagePreview = getMessagePreview();
  const timeLabel = formatTime(updatedAt || lastMessage?.createdAt);
  const hasUnread = unreadCount > 0;

  return (
    <div
      onClick={() => onOpen(_id)}
      className={`
        flex items-center gap-3
        p-3 my-1 rounded-2xl
        cursor-pointer
        transition-colors duration-200
        border border-transparent
        hover:bg-surface-high
        ${isActive ? 'bg-surface-high border-outline' : ''}
        ${hasUnread && !isActive ? 'bg-primary-500/5' : ''}
      `}
      role="button"
      aria-current={isActive ? 'page' : undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(_id);
        }
      }}
    >
      {/* Avatar Section */}
      <div className="relative shrink-0">
        <UserAvatar
          src={displayAvatar}
          alt={displayName}
          size="md"
          className="ring-2 ring-surface-lowest"
        />

      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          {/* Name */}
          <h3
            className={`
              text-[15px] min-w-0 flex-1 truncate
              ${hasUnread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-800'}
            `}
          >
            {displayName}
          </h3>

          {/* Timestamp */}
          <span
            className={`
              text-[11px] shrink-0 ms-auto whitespace-nowrap
              ${hasUnread ? 'text-secondary-700 dark:text-secondary-400 font-medium' : 'text-neutral-500'}
            `}
          >
            {timeLabel}
          </span>
        </div>

        {/* Last Message Preview */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={`
              text-body-2 truncate
              ${hasUnread ? 'text-neutral-700 font-medium' : 'text-neutral-600'}
            `}
          >
            {messagePreview || content.noMessages}
          </p>

          {/* Unread Count Badge */}
          {hasUnread && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[11px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default ConversationItem;
