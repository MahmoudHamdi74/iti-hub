import React from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { HiArrowPathRoundedSquare } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer'
import { InteractionButton } from '@/components/shared/InteractionButton';

/**
 * RepostMenu - Dropdown menu for repost options
 * 
 * @component
 * @example
 * <RepostMenu
 *   repostCount={5}
 *   isReposted={false}
 *   onRepost={handleRepost}
 *   onRepostWithComment={handleRepostWithComment}
 * />
 * 
 * @param {Object} props
 * @param {number} [props.repostCount=0] - Number of reposts
 * @param {boolean} [props.isReposted=false] - Whether current user reposted this
 * @param {Function} props.onRepost - Handler for instant repost
 * @param {Function} props.onRepostWithComment - Handler for repost with comment
 * @param {string} [props.className] - Additional CSS classes
 */
export function RepostMenu({
  repostCount = 0,
  isReposted = false,
  onRepost,
  onRepostWithComment,
  className = '',
}) {
  const content = useIntlayer('repost-menu');

  return (
    <Menu as="div" className={`relative ${className}`}>
      <MenuButton
        aria-label={content.repost}
        className={`flex items-center gap-2 hover:bg-neutral-50 px-3 py-2 rounded-full transition-colors cursor-pointer ${isReposted ? 'text-green-500' : 'text-neutral-600'}`}
      >
        <HiArrowPathRoundedSquare className="w-5 h-5" />
        {repostCount > 0 && <span className="text-sm font-medium">{repostCount > 999 ? `${(repostCount / 1000).toFixed(1)}k` : repostCount}</span>}
      </MenuButton>

      <MenuItems 
        anchor="bottom start"
        className="w-56 bg-neutral-100 rounded-lg shadow-elevation-2 border border-neutral-200 py-1 z-50 [--anchor-gap:4px]"
      >
        {/* Repost Now */}
        <MenuItem>
          {({ focus }) => (
            <button
              onClick={onRepost}
              className={`w-full px-4 py-3 text-start ${
                focus ? 'bg-neutral-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <HiArrowPathRoundedSquare className="w-5 h-5 mt-0.5 text-neutral-700" />
                <div>
                  <div className="text-body-2 font-medium text-neutral-900">
                    {content.repostNow}
                  </div>
                  <div className="text-caption text-neutral-600 mt-0.5">
                    {content.repostNowDescription}
                  </div>
                </div>
              </div>
            </button>
          )}
        </MenuItem>

        {/* Repost with Comment */}
        <MenuItem>
          {({ focus }) => (
            <button
              onClick={onRepostWithComment}
              className={`w-full px-4 py-3 text-start ${
                focus ? 'bg-neutral-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <HiArrowPathRoundedSquare className="w-5 h-5 mt-0.5 text-neutral-700" />
                <div>
                  <div className="text-body-2 font-medium text-neutral-900">
                    {content.repostWithComment}
                  </div>
                  <div className="text-caption text-neutral-600 mt-0.5">
                    {content.repostWithCommentDescription}
                  </div>
                </div>
              </div>
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
