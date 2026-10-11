import { UserAvatar } from '@/components/user/UserAvatar';
import { useIntlayer, useLocale } from 'react-intlayer';
import { HiOutlineArrowLeft, HiOutlineInformationCircle } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

/**
 * @fileoverview Header component for conversation detail view
 * Shows conversation info and navigation
 */

/**
 * ConversationHeader - Header for conversation with back button and info
 * 
 * @param {Object} props
 * @param {Object} props.conversation - Conversation data
 * @param {Array} [props.participants=[]] - List of participants
 * @param {string} props.currentUserId - Current user ID
 * @param {Function} [props.onInfoClick] - Callback for info button (group management)
 * @returns {JSX.Element}
 */
export function ConversationHeader({
  conversation,
  participants = [],
  currentUserId,
  onInfoClick,
}) {
  const content = useIntlayer('conversationDetail');
  const { locale } = useLocale();
  const navigate = useNavigate();

  if (!conversation) return null;

  const { isGroup, name, image } = conversation;

  // Determine display name and avatar
  let displayName = name;
  let displayAvatar = image;
  let subtitle = '';

  if (!isGroup && participants) {
    const otherParticipant = participants.find((p) => p._id !== currentUserId);
    displayName = otherParticipant?.fullName || otherParticipant?.username || content.unknownUser.value;
    displayAvatar = otherParticipant?.profilePicture;
    subtitle = otherParticipant?.username ? `@${otherParticipant.username}` : '';
  } else if (isGroup) {
    const memberCount = participants.length;
    subtitle = memberCount === 1
      ? content.member.value
      : content.members[locale]({ count: memberCount });
  }

  return (
    <div className="shrink-0 z-3 bg-neutral-100 border-b border-outline">
      <div className="flex items-center gap-3 px-4 py-4 lg:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/messages')}
          className="lg:hidden p-2 -ms-2 text-neutral-600 hover:text-neutral-900 hover:bg-surface-high rounded-lg transition-colors"
          aria-label={content.backToMessages.value}
        >
          <HiOutlineArrowLeft className="w-6 h-6 rtl:[transform:scaleX(-1)]" />
        </button>

        {/* Avatar */}
        <UserAvatar
          src={displayAvatar}
          alt={displayName}
          size="md"
          className="ring-2 ring-surface-lowest"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-heading-6 font-semibold text-neutral-900 truncate">
            {displayName}
          </h2>
          {subtitle && (
            <p className="text-body-2 text-neutral-600 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Info Button (for groups) — opens GroupSettingsModal (group management) */}
          {isGroup && (
            <button
              onClick={onInfoClick}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-surface-high rounded-lg transition-colors"
              aria-label={content.conversationInfo.value}
            >
              <HiOutlineInformationCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationHeader;
