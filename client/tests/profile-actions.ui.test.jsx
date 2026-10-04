import React from 'react';
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileHeader from '../src/components/profile/ProfileHeader';
import { useAuthStore } from '../src/store/auth';
import { useLoginModalStore } from '../src/hooks/useRequireAuth';

const api = vi.hoisted(() => ({ post: vi.fn(), delete: vi.fn() }));
vi.mock('@lib/api', () => ({ default: api }));
vi.mock('react-intlayer', () => ({ useIntlayer: () => ({
  viewPhoto: { value: 'View profile photo' }, closePhoto: { value: 'Close photo' },
  updateProfilePicture: 'Update Profile Picture', updateCoverPhoto: 'Update cover',
  messageUser: 'Message', editProfile: 'Edit Profile', follow: 'Follow', followBack: 'Follow Back', following: 'Following', block: 'Block',
}) }));
vi.mock('../src/components/profile/EditProfile', () => ({ default: () => null }));
vi.mock('@components/common/ConfirmDialog', () => ({ default: () => null }));
const profile = { _id: 'recipient', username: 'recipient', fullName: 'Recipient', profilePicture: 'https://example.test/photo.jpg' };
function setup(own = false, authenticated = true, relationship = {}) {
  useAuthStore.setState({ isAuthenticated: authenticated, user: { ...profile, _id: own ? 'recipient' : 'sender', role: 'super_admin' } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><Routes>
    <Route path="/" element={<ProfileHeader profile={{ ...profile, ...relationship }} isOwnProfile={own} />} />
    <Route path="/messages/:id" element={<h1>Conversation opened</h1>} />
  </Routes></MemoryRouter></QueryClientProvider>);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); useLoginModalStore.getState().closeModal(); });
test('profile message action creates or resumes the conversation and navigates to it', async () => {
  api.post.mockResolvedValue({ data: { data: { conversation: { _id: 'existing' } } } });
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Message' }));
  expect(await screen.findByText('Conversation opened')).toBeTruthy();
  expect(api.post).toHaveBeenCalledWith('/conversations', { participantId: 'recipient' });
});
test('guest message action requests login before creating a conversation', () => {
  setup(false, false);
  fireEvent.click(screen.getByRole('button', { name: 'Message' }));
  expect(useLoginModalStore.getState().isOpen).toBe(true);
  expect(api.post).not.toHaveBeenCalled();
});
test('own photo opens viewer, updates without losing role, and cannot message self', async () => {
  api.post.mockResolvedValue({ data: { data: { user: { _id: 'recipient', profilePicture: 'https://example.test/new.jpg' } } } });
  const view = setup(true);
  expect(screen.queryByRole('button', { name: 'Message' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'View profile photo' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog.querySelector('img').src).toBe(profile.profilePicture);
  const input = view.container.querySelectorAll('input[type=file]')[1];
  const click = vi.spyOn(input, 'click');
  fireEvent.click(screen.getByRole('button', { name: 'Update Profile Picture' }));
  expect(click).toHaveBeenCalled();
  fireEvent.change(input, { target: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] } });
  await waitFor(() => expect(dialog.querySelector('img').src).toBe('https://example.test/new.jpg'));
  expect(useAuthStore.getState().user.role).toBe('super_admin');
  fireEvent.click(screen.getByRole('button', { name: 'Close photo' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
test('another user photo is viewable without an edit action', async () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'View profile photo' }));
  expect(await screen.findByRole('dialog')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Update Profile Picture' })).toBeNull();
});

test.each([
  [false, false, 'Follow'],
  [true, false, 'Follow Back'],
  [true, true, 'Following'],
  [false, true, 'Following'],
])('follow button reflects incoming=%s outgoing=%s', async (followsYou, isFollowing, label) => {
  api.post.mockResolvedValue({ data: {} });
  api.delete.mockResolvedValue({ data: {} });
  setup(false, true, { followsYou, isFollowing });
  fireEvent.click(screen.getByRole('button', { name: label, exact: true }));
  await waitFor(() => expect(isFollowing ? api.delete : api.post).toHaveBeenCalledWith('/users/recipient/follow'));
});
