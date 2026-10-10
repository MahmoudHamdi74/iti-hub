import React from 'react';
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommentsSection from '../src/components/comments/CommentsSection';
import { useAuthStore } from '../src/store/auth';
import { useLoginModalStore } from '../src/hooks/useRequireAuth';

const mocks = vi.hoisted(() => ({ create: vi.fn(), more: vi.fn() }));
vi.mock('react-intlayer', () => ({ useIntlayer: () => ({ title: 'Comments', reply: 'Reply', replies: 'Replies', like: 'Like', submit: 'Submit', placeholder: { value: 'Write a comment' }, view: 'View', viewReplies: 'View replies', hideReplies: 'Hide replies' }) }));
vi.mock('@components/common', () => ({ Loading: () => null }));
vi.mock('@components/common/ConfirmDialog', () => ({ default: () => null }));
vi.mock('@hooks/queries/usePostComments', () => ({ default: () => ({ data: { pages: [{ data: { comments: [{ _id: 'parent', content: 'A comment', author: { _id: 'other', fullName: 'Other' }, createdAt: '2026-01-01', repliesCount: 1 }] } }] } }) }));
vi.mock('@hooks/queries/useCommentReplies', () => ({ default: () => ({ data: { pages: [{ data: { comments: [{ _id: 'reply', content: 'A reply', author: { _id: 'other', fullName: 'Other' }, createdAt: '2026-01-02' }] } }] }, hasNextPage: true, fetchNextPage: mocks.more }) }));
vi.mock('@hooks/mutations/useCreateComment', () => ({ default: () => ({ mutateAsync: mocks.create }) }));
vi.mock('@hooks/mutations/useUpdateComment', () => ({ default: () => ({}) }));
vi.mock('@hooks/mutations/useDeleteComment', () => ({ default: () => ({}) }));
vi.mock('@hooks/mutations/useToggleCommentLike', () => ({ default: () => ({}) }));
function setup(authenticated = true) {
  useAuthStore.setState({ isAuthenticated: authenticated, user: authenticated ? { _id: 'viewer' } : null });
  return render(<MemoryRouter><CommentsSection postId="post" authorId="other" /></MemoryRouter>);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); useLoginModalStore.getState().closeModal(); });
test('visible reply action submits against the parent and exposes paginated replies', async () => {
  mocks.create.mockImplementation(async (_, callbacks) => callbacks?.onSuccess());
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Reply', exact: true }));
  const forms = screen.getAllByRole('textbox');
  fireEvent.change(forms[1], { target: { value: 'My answer' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Submit', exact: true })[1]);
  await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ postId: 'post', content: 'My answer', parentCommentId: 'parent' }, expect.any(Object)));
  expect(await screen.findByText('A reply')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'View replies' }));
  expect(mocks.more).toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole('button', { name: 'Reply', exact: true })[1]);
  expect(screen.getAllByRole('textbox')).toHaveLength(2);
});
test('guest reply requests login instead of silently doing nothing', () => {
  setup(false);
  fireEvent.click(screen.getByRole('button', { name: 'Reply', exact: true }));
  expect(useLoginModalStore.getState().isOpen).toBe(true);
  expect(mocks.create).not.toHaveBeenCalled();
});
