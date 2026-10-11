import { useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useIntlayer } from 'react-intlayer';
import MessageItem from './MessageItem';
import Loading from '@/components/common/Loading';
import Button from '@/components/common/Button';
import { useUIStore } from '@store/uiStore';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';

dayjs.extend(calendar);
dayjs.extend(localizedFormat);

/**
 * @fileoverview Message list component with auto-scroll and infinite loading
 * Displays messages in chronological order with date separators
 */

/**
 * MessageList - Displays a scrollable list of messages
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of message objects
 * @param {string} props.currentUserId - ID of the current user
 * @param {boolean} [props.isGroup=false] - Whether this is a group conversation
 * @param {Array} [props.participants=[]] - List of participants
 * @param {boolean} [props.loading=false] - Whether messages are loading
 * @param {boolean} [props.hasOlderMessages=false] - Whether more messages can be loaded
 * @param {boolean} [props.loadingOlder=false] - Whether older messages are loading
 * @param {Function} [props.onLoadOlder] - Callback to load older messages
 * @param {Function} [props.onRetryMessage] - Callback to retry failed message
 * @param {Function} [props.onImageClick] - Callback when image is clicked
 * @returns {JSX.Element}
 */
export function MessageList({
  items = [],
  currentUserId,
  conversation,
  participants = [],
  loading = false,
  hasOlderMessages = false,
  loadingOlder = false,
  onLoadOlder,
  onRetryMessage,
  onImageClick,
  onReply,
}) {
  const content = useIntlayer('conversationDetail');
  const { locale } = useUIStore();
  const isGroup = conversation?.isGroup;
  const scrollContainerRef = useRef(null);
  const pinned = useRef(true);
  const previous = useRef(null);
  const anchor = useRef(null);
  const fetchingOlder = useRef(false);
  dayjs.locale(locale);

  const loadOlder = useCallback(async () => {
    const element = scrollContainerRef.current;
    if (!element || !hasOlderMessages || loadingOlder || fetchingOlder.current) return;
    anchor.current = { height: element.scrollHeight, top: element.scrollTop };
    fetchingOlder.current = true;
    try { await onLoadOlder?.(); } finally { fetchingOlder.current = false; }
  }, [hasOlderMessages, loadingOlder, onLoadOlder]);

  useLayoutEffect(() => {
    const element = scrollContainerRef.current;
    if (!element || !items.length) return;
    const first = items[0]._id, last = items.at(-1)._id;
    if (!previous.current) {
      element.scrollTop = element.scrollHeight;
      pinned.current = true;
    } else if (first !== previous.current.first && anchor.current) {
      element.scrollTop = anchor.current.top + element.scrollHeight - anchor.current.height;
      anchor.current = null;
    } else if (last !== previous.current.last && (pinned.current || (items.at(-1).sender?._id || items.at(-1).sender) === currentUserId)) {
      element.scrollTop = element.scrollHeight;
      pinned.current = true;
    }
    previous.current = { first, last };
  }, [items, currentUserId]);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => { if (pinned.current) element.scrollTop = element.scrollHeight; });
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [items.length]);

  const handleScroll = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) return;
    pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight < 60;
    if (element.scrollTop < 60 && !pinned.current) loadOlder();
  }, [loadOlder]);

  // Group messages by date - MEMOIZED for performance
  const messageGroups = useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    items.forEach((message) => {
      const messageDate = dayjs(message.createdAt).format('YYYY-MM-DD');

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [items]);

  // Format date separator - MEMOIZED for performance
  const formatDateSeparator = useCallback((dateString) => {
    const date = dayjs(dateString);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');

    if (date.isSame(today, 'day')) {
      return content.dateSeparators.today.value;
    } else if (date.isSame(yesterday, 'day')) {
      return content.dateSeparators.yesterday.value;
    } else {
      // Use localized date format
      return date.format('LL'); // e.g., "January 1, 2024" or "١ يناير ٢٠٢٤"
    }
  }, [content.dateSeparators]);

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading text={content.loadingMessages.value} />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-heading-6 text-neutral-900 mb-2">
          {content.noMessages.value}
        </h3>
        <p className="text-body-2 text-neutral-600">
          {content.noMessagesDescription.value}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      data-testid="message-scroll"
      onLoadCapture={() => { if (pinned.current && scrollContainerRef.current) scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight; }}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 lg:px-8 space-y-4"
    >
      {/* Load Older Messages Button - Intersection Observer Target */}
      {hasOlderMessages && (
        <div className="flex justify-center mb-4">
          {loadingOlder ? (
            <Loading text={content.loadingOlderMessages.value} size="sm" />
          ) : (
            <Button
              variant="text"
              onClick={loadOlder}
              className="text-secondary-600"
            >
              {content.loadingOlderMessages.value}
            </Button>
          )}
        </div>
      )}

      {/* Messages Grouped by Date */}
      {messageGroups.map((group) => (
        <div key={group.date} className="space-y-2 mx-auto w-full max-w-3xl">
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-neutral-100 px-3 py-1 rounded-full">
              <span className="text-xs text-neutral-600 font-medium">
                {formatDateSeparator(group.date)}
              </span>
            </div>
          </div>

          {/* Messages */}
          {group.messages.map((message) => (
            <MessageItem
              key={message._id}
              message={message}
              isOwn={message.sender?._id === currentUserId}
              isGroup={isGroup}
              participants={participants}
              onRetry={onRetryMessage}
              onImageClick={onImageClick}
              onReply={onReply}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default MessageList;
