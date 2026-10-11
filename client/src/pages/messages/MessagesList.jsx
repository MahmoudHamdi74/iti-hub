import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';

// Hooks
import { useConversations } from '@hooks/queries/useConversations';
import  useMessagingSocket  from '@hooks/socket/useMessagingSocket';

// Components
import ConversationsList from '@components/messaging/ConversationsList';
import NewMessageModal from '@components/messaging/NewMessageModal';
import NewGroupModal from '@components/messaging/NewGroupModal';
import Button from '@components/common/Button';
import { HiOutlinePencilSquare, HiOutlineUserGroup, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

/**
 * @fileoverview Messages list page
 * Shows all conversations with search and create actions
 */

export function MessagesList() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const content = useIntlayer('messagesList');

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading,
    error,
    refetch,
  } = useConversations({ page: 1, limit: 50 });

  // Setup real-time updates
  useMessagingSocket();

  // Extract conversations
  const conversations = conversationsData?.data?.conversations || [];

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // Search by conversation name
    if (conv.name && conv.name.toLowerCase().includes(query)) {
      return true;
    }

    // Search by participant names
    if (conv.participants) {
      return conv.participants.some(
        (p) =>
          p.username?.toLowerCase().includes(query) ||
          p.fullName?.toLowerCase().includes(query)
      );
    }

    return false;
  });

  // Handle conversation click
  const handleConversationOpen = (conversationId) => {
    navigate(`/messages/${conversationId}`);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-100">
      {/* Header */}
      <div className="shrink-0 bg-neutral-100 border-b border-outline">
        <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 whitespace-nowrap">
            {content.recentChats?.value || content.pageTitle.value}
          </h1>

          <div className="flex items-center gap-1.5">
            {/* New Message Button */}
            <Button
              variant="text"
              onClick={() => setShowNewMessageModal(true)}
              className="h-11! w-11! p-0! rounded-xl! shrink-0"
              aria-label={content.newMessage.value}
            >
              <HiOutlinePencilSquare className="w-5 h-5" />

            </Button>

            {/* New Group Button */}
            <Button
              variant="primary"
              onClick={() => setShowNewGroupModal(true)}
              className="h-11! w-11! p-0! rounded-xl! shrink-0"
              aria-label={content.newGroup.value}
            >
              <HiOutlineUserGroup className="w-5 h-5" />

            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mx-4 mb-4">
          <HiOutlineMagnifyingGlass aria-hidden="true" className="pointer-events-none absolute start-3 top-3.5 h-5 w-5 text-neutral-500" />
          <input
            type="search"
            aria-label={content.searchPlaceholder.value}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={content.searchPlaceholder.value}
            className="
              w-full ps-10 pe-4 py-3
              bg-surface
              border border-outline
              rounded-xl
              text-body-2
              placeholder:text-neutral-500
              focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-surface-lowest
              transition-colors
            "
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2">
        <ConversationsList
          currentConversationId={pathname.split('/')[2]}
          items={filteredConversations}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          onConversationOpen={handleConversationOpen}
        />
      </div>

      {/* Modals */}
      {showNewMessageModal && (
        <NewMessageModal
          isOpen={showNewMessageModal}
          onClose={() => setShowNewMessageModal(false)}
        />
      )}
      {showNewGroupModal && (
        <NewGroupModal
          isOpen={showNewGroupModal}
          onClose={() => setShowNewGroupModal(false)}
        />
      )}
    </div>
  );
}

export default MessagesList;
