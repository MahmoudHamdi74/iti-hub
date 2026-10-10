import React from 'react';
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RepostMenu } from '../src/components/post/RepostMenu';
vi.mock('react-intlayer', () => ({ useIntlayer: () => ({ repost: 'Repost', repostNow: 'Repost now', repostWithComment: 'Repost with comment' }) }));
afterEach(cleanup);
test('repost button opens the menu and both actions work', async () => {
 const repost=vi.fn(), quote=vi.fn();
 render(<RepostMenu onRepost={repost} onRepostWithComment={quote} />);
 fireEvent.click(screen.getByRole('button', {name:'Repost'}));
 fireEvent.click(await screen.findByText('Repost now'));expect(repost).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button', {name:'Repost'}));
 fireEvent.click(await screen.findByText('Repost with comment'));expect(quote).toHaveBeenCalledOnce();
});
