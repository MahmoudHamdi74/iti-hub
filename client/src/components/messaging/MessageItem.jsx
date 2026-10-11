import { memo, useRef, useState } from 'react';
import { UserAvatar } from '@/components/user/UserAvatar';
import { useIntlayer } from 'react-intlayer';
import dayjs from 'dayjs';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi2';
import { AiOutlineLoading } from 'react-icons/ai';
import { BsCheckAll, BsCheck } from 'react-icons/bs';

/**
 * @fileoverview Message bubble component for displaying individual messages
 * Supports text, images, status indicators, and seen receipts
 */

/**
 * MessageItem - Displays a single message in the conversation
 * Memoized to prevent unnecessary re-renders
 * 
 * @param {Object} props
 * @param {Object} props.message - Message data
 * @param {boolean} props.isOwn - Whether this is the current user's message
 * @param {boolean} [props.isGroup=false] - Whether this is a group conversation
 * @param {Array} [props.participants=[]] - List of participants for seen status
 * @param {Function} [props.onRetry] - Callback to retry failed message
 * @param {Function} [props.onImageClick] - Callback when image is clicked
 * @returns {JSX.Element}
 */
export const MessageItem = memo(function MessageItem({
  message,
  isOwn,
  isGroup = false,
  participants = [],
  onRetry,
  onImageClick,
  onReply,
}) {
  const content = useIntlayer('conversationDetail');
  const touchStart = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const reply = () => { onReply?.(message); setShowActions(false); };

  if (!message) return null;

  const {
    _id,
    sender,
    content: messageContent,
    image,
    status = 'delivered',
    seenBy = [],
    createdAt,
  } = message;

  // Format timestamp
  const formatTime = (timestamp) => {
    return dayjs(timestamp).format('h:mm A');
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!isOwn) return null;

    if (status === 'sending') {
      return <AiOutlineLoading className="w-3 h-3 animate-spin text-neutral-400" />;
    }

    if (status === 'failed') {
      return (
        <button
          onClick={() => onRetry?.(_id)}
          className="flex items-center gap-1 text-error hover:text-error/80 text-xs"
          title={content.failed.value}
        >
          <HiXCircle className="w-3 h-3" />
          <span>{content.tryAgain.value}</span>
        </button>
      );
    }

    // Check if message has been seen
    const isSeen = seenBy && seenBy.length > 0;

    if (isSeen) {
      return (
        <BsCheckAll
          className="w-4 h-4 text-secondary-500"
          title={content.seen.value}
        />
      );
    }

    return (
      <BsCheck
        className="w-4 h-4 text-neutral-400"
        title={content.delivered.value}
      />
    );
  };

  // Get seen by names (for group chats)
  const getSeenByText = () => {
    if (!isOwn || !isGroup || !seenBy || seenBy.length === 0) return null;

    const seenByUsers = seenBy
      .map((userId) => {
        const participant = participants.find((p) => p._id === userId);
        return participant?.username;
      })
      .filter(Boolean);

    if (seenByUsers.length === 0) return null;

    return `${content.seen.value} ${seenByUsers.join(', ')}`;
  };

  const seenByText = getSeenByText();

  return (
    <div
      data-message-id={message._id}
      tabIndex={0}
      onKeyDown={event => { if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); setShowActions(true); } }}
      onContextMenu={event => { if (onReply && !message.isTemp) { event.preventDefault(); setShowActions(true); } }}
      onTouchStart={event => { const t = event.touches[0]; touchStart.current = { x: t.clientX, y: t.clientY }; }}
      onTouchEnd={event => { const t = event.changedTouches[0], start = touchStart.current; if (start && Math.abs(t.clientX - start.x) > 60 && Math.abs(t.clientY - start.y) < 35 && !message.isTemp) reply(); touchStart.current = null; }}
      className={`relative flex items-end gap-2 mb-2 ${
        isOwn ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar (only for other users in groups) */}
      {!isOwn && isGroup && (
        <div className="shrink-0">
          <UserAvatar
            src={sender?.profilePicture}
            alt={sender?.username || content.unknownUser.value}
            size="sm"
          />
        </div>
      )}

      {showActions && <div className="absolute top-0 end-0 z-10 rounded-lg border border-outline bg-neutral-100 p-2 shadow-lg" onKeyDown={event => { if (event.key === 'Escape') setShowActions(false); }}><button type="button" onClick={reply} className="px-3 py-2 text-neutral-900">{content.reply?.value || 'Reply'}</button><button type="button" className="px-2" aria-label={content.cancelReply?.value || 'Cancel reply'} onClick={() => setShowActions(false)}>×</button></div>}
      {/* Message Bubble */}
      <div
        className={`flex flex-col max-w-[70%] ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender Name (only for other users in groups) */}
        {!isOwn && isGroup && (
          <span className="text-xs text-neutral-600 mb-1 px-3">
            {sender?.username || content.unknownUser.value}
          </span>
        )}

        {/* Bubble Content */}
        <div
          className={`
            rounded-2xl px-4 py-2 shadow-elevation-1
            ${isOwn
              ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-ee-md'
              : 'bg-neutral-100 border border-outline text-neutral-900 rounded-es-md'
            }
            ${status === 'failed' ? 'opacity-50' : ''}
          `}
        >
          {message.replyTo && <div className="mb-2 border-s-2 border-current ps-2 text-xs opacity-90"><strong>{message.replyTo.sender?.username || content.reply?.value || 'Reply'}</strong><p className="line-clamp-2 break-words">{message.replyTo.content || content.photo?.value}</p></div>}
          {/* Image */}
          {image && (
            <div className="mb-2">
              <img
                src={image}
                alt={content.photo.value}
                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onImageClick?.(image)}
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          {/* Text Content */}
          {messageContent && (
            <p className="text-body-2 whitespace-pre-wrap wrap-break-word">
              {messageContent}
            </p>
          )}

          {/* Timestamp & Status */}
          <div
            className={`
              flex items-center gap-1 mt-1
              ${isOwn ? 'justify-end' : 'justify-start'}
            `}
          >
            <span
              className={`text-xs ${
                isOwn ? 'text-primary-100' : 'text-neutral-500'
              }`}
            >
              {formatTime(createdAt)}
            </span>
            {getStatusIcon()}
          </div>
        </div>

        {/* Seen By (group chats, own messages) */}
        {seenByText && (
          <span className="text-xs text-neutral-500 mt-1 px-3">
            {seenByText}
          </span>
        )}
      </div>

      {/* Spacer for alignment when no avatar */}
      {isOwn && <div className="w-6 shrink-0" />}
    </div>
  );
});

export default MessageItem;
