import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import MessagesList from '@pages/messages/MessagesList';

/**
 * @fileoverview Two-panel messages shell matching /screens:
 * left "Recent Chats" panel + right conversation panel.
 * On mobile, only one panel is visible at a time.
 *
 * NOTE: The left panel always renders <MessagesList /> directly.
 * Only the right panel uses <Outlet /> (for :conversationId).
 * Rendering <Outlet /> in both panels would mount ConversationDetail
 * twice on desktop and hide the conversations list.
 */
export default function MessagesShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const content = useIntlayer('messagesList');

  // "/messages" -> list active; "/messages/:id" -> detail active
  const conversationId = location.pathname.split('/')[2];
  const hasConversation = Boolean(conversationId);

  return (
    <div className="h-[calc(100dvh-7.5rem-1px)] lg:h-[calc(100dvh-2rem)] lg:my-4 lg:me-4 min-h-0 flex overflow-hidden bg-neutral-100 border-outline lg:rounded-3xl lg:border lg:shadow-sm">
      {/* Left panel — conversations list (always visible on desktop) */}
      <div
        className={`w-full lg:w-[320px] xl:w-[350px] lg:shrink-0 h-full overflow-hidden ltr:border-r rtl:border-l border-outline ${
          hasConversation ? 'hidden lg:block' : 'block'
        }`}
      >
        <MessagesList />
      </div>

      {/* Right panel — active conversation or empty state */}
      <div
        className={`flex-1 h-full min-w-0 bg-neutral-50 ${hasConversation ? 'block' : 'hidden lg:flex'}`}
      >
        {hasConversation ? (
          <Outlet key={conversationId} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-6 bg-[radial-gradient(ellipse_at_center,var(--color-surface-high),transparent_70%)]">
            <span className="w-24 h-24 rounded-3xl bg-surface-high flex items-center justify-center mb-4">
              <HiOutlineChatBubbleLeftRight className="w-10 h-10 text-primary-600" strokeWidth={1.5} />
            </span>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">
              {content.selectConversationTitle?.value || 'Your messages'}
            </h2>
            <p className="text-body-2 text-neutral-500 max-w-xs">
              {content.selectConversationMessage?.value ||
                'Select a chat from the list to start messaging.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-4 lg:hidden text-body-2 font-semibold text-primary-600"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
