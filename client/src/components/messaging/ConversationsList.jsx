import { useIntlayer } from 'react-intlayer';
import ConversationItem from './ConversationItem';
import Loading from '@/components/common/Loading';
import ErrorDisplay from '@/components/common/ErrorDisplay';

/**
 * @fileoverview Conversations list wrapper component
 * Displays list of conversations with loading and error states
 */

/**
 * ConversationsList - Displays a list of conversations
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of conversation objects
 * @param {string} [props.currentConversationId] - ID of currently active conversation
 * @param {boolean} [props.loading=false] - Whether conversations are loading
 * @param {Object} [props.error] - Error object if fetch failed
 * @param {Function} [props.onRetry] - Callback to retry fetching
 * @param {Function} props.onConversationOpen - Callback when a conversation is clicked
 * @param {boolean} [props.hasMore=false] - Whether more conversations can be loaded
 * @param {boolean} [props.loadingMore=false] - Whether more conversations are loading
 * @param {Function} [props.onLoadMore] - Callback to load more conversations
 * @returns {JSX.Element}
 */
export function ConversationsList({
  items = [],
  currentConversationId,
  loading = false,
  error = null,
  onRetry,
  onConversationOpen,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) {
  const content = useIntlayer('messagesList');

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loading text={content.loadingConversations.value} />
      </div>
    );
  }

  // Error state
  if (error && items.length === 0) {
    return (
      <div className="p-4">
        <ErrorDisplay
          error={{
            message: content.errorLoadingConversations.value,
          }}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-4 rounded-full bg-neutral-200 flex items-center justify-center">
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
          {content.noConversations.value}
        </h3>
        <p className="text-body-2 text-neutral-600">
          {content.noConversationsDescription.value}
        </p>
      </div>
    );
  }

  // Conversations list
  return (
    <div className="flex flex-col">
      {/* Conversations */}
      <div className="space-y-1">
        {items.map((conversation) => (
          <ConversationItem
            key={conversation._id}
            conversation={conversation}
            onOpen={onConversationOpen}
            isActive={conversation._id === currentConversationId}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="p-4 flex justify-center">
          {loadingMore ? (
            <Loading text={content.loadingMore.value} size="sm" />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-secondary-700 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-300 text-body-2 font-medium transition-colors"
            >
              {content.loadingMore.value}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ConversationsList;
