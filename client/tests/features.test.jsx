import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Lightbox from '../src/components/common/Lightbox';
import ProfileSettings from '../src/pages/settings/ProfileSettings';
import EmailOtpController from '../src/pages/auth/EmailOtpController';
import { toast } from 'react-hot-toast';

const mocks = vi.hoisted(() => ({
  update: vi.fn().mockResolvedValue({ data: { data: { username: 'new_name' } } }),
  upload: vi.fn().mockResolvedValue({ data: { user: { profilePicture: 'https://example.com/new.jpg' } } }),
  create: vi.fn().mockResolvedValue({}), check: vi.fn(), setUser: vi.fn(), verify: vi.fn(),
}));
vi.mock('react-intlayer', () => ({ useIntlayer: key => key === 'authOtp' ? {
  pageTitle: 'Verify email', description: 'Enter code', otpLabel: { value: 'Digit' }, verifyButton: 'Verify', resendButton: 'Resend',
} : new Proxy({}, { get: (_, key) => ({ value: key }) }) }));
vi.mock('react-hot-toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@store/auth', () => ({ useAuthStore: selector => {
  const state = { setUser: mocks.setUser, setToken: vi.fn() }; return selector ? selector(state) : state;
} }));
vi.mock('@components/common', () => ({ Card: ({ children }) => <div>{children}</div> }));
vi.mock('@hooks/mutations/useCourseMutations', () => ({ useSettingsUpdateProfile: () => ({ mutateAsync: mocks.update }) }));
vi.mock('@hooks/mutations/useUserMutations', () => ({
  useUploadProfilePicture: () => ({ mutateAsync: mocks.upload }), useUploadCoverImage: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@hooks/mutations/useCheckUsernameAvailability', () => ({ useCheckUsernameAvailability: () => ({ mutate: mocks.check }) }));
vi.mock('@hooks/mutations/useCreatePost', () => ({ useCreatePost: () => ({ mutateAsync: mocks.create }) }));
vi.mock('@hooks/mutations/useVerifyOtp', () => ({ useVerifyOtp: () => ({ mutate: mocks.verify }), useResendOtp: () => ({ mutate: vi.fn() }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

test('opens linked images without navigating; closes with Escape', async () => {
  const navigate = vi.fn();
  render(<><a href="/profile" onClick={navigate}><img src="/photo.jpg" alt="Photo" /></a><Lightbox /></>);
  fireEvent.click(screen.getByAltText('Photo'));
  expect(await screen.findByRole('dialog')).toBeTruthy();
  expect(navigate).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('opens videos with native controls in the viewer', async () => {
  render(<><video controls src="/clip.mp4" data-testid="video" /><Lightbox /></>);
  fireEvent.click(screen.getByTestId('video'));
  expect((await screen.findByRole('dialog')).querySelector('video').getAttribute('src')).toContain('clip.mp4');
});

test('saves the requested username even when availability is still pending', async () => {
  render(<ProfileSettings user={{ username: 'old_name', fullName: 'Test User' }} />);
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'new_name' } });
  fireEvent.submit(screen.getByLabelText('Username').closest('form'));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ username: 'new_name' })));
});

test('does not report success when an older API silently ignores the username', async () => {
  mocks.update.mockResolvedValueOnce({ data: { data: { username: 'old_name' } } });
  render(<ProfileSettings user={{ username: 'old_name', fullName: 'Test User' }} />);
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'new_name' } });
  fireEvent.submit(screen.getByLabelText('Username').closest('form'));
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('did not save')));
  expect(toast.success).not.toHaveBeenCalled();
  expect(mocks.setUser).not.toHaveBeenCalled();
});

test('uploaded profile photo can be shared to the feed', async () => {
  render(<ProfileSettings user={{ username: 'reviewer', role: 'student', fullName: 'Test User' }} />);
  const file = new File(['image'], 'photo.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Change photo'), { target: { files: [file] } });
  fireEvent.click(await screen.findByText('Share to feed'));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ images: [file] })));
  expect(mocks.setUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'student', profilePicture: 'https://example.com/new.jpg' }));
});

test('OTP advances focus and submits the six digits', () => {
  render(<MemoryRouter initialEntries={['/verify-otp?email=review@example.com']}><EmailOtpController /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Digit 1'), { target: { value: '1' } });
  expect(document.activeElement).toBe(screen.getByLabelText('Digit 2'));
  fireEvent.paste(screen.getByLabelText('Digit 1'), { clipboardData: { getData: () => '123456' } });
  fireEvent.click(screen.getByText('Verify'));
  expect(mocks.verify).toHaveBeenCalledWith({ email: 'review@example.com', otp: '123456' }, expect.any(Object));
});
