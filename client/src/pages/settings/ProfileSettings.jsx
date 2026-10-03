import { useEffect, useRef, useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { HiCheck, HiXMark, HiOutlineShare } from 'react-icons/hi2';
import { useSettingsUpdateProfile } from '@hooks/mutations/useCourseMutations';
import { useUploadProfilePicture, useUploadCoverImage } from '@hooks/mutations/useUserMutations';
import { useCheckUsernameAvailability } from '@hooks/mutations/useCheckUsernameAvailability';
import { useCreatePost } from '@hooks/mutations/useCreatePost';
import { useAuthStore } from '@/store/auth';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

export default function ProfileSettings({ user }) {
  const content = useIntlayer('settings');
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  const [location, setLocation] = useState(user?.location || '');

  // Username availability — debounced like the register flow
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle|checking|available|taken|invalid
  const checkUsernameMutation = useCheckUsernameAvailability();
  const usernameDebounceRef = useRef(null);

  useEffect(() => {
    let active = true;
    const value = username.trim().toLowerCase();
    clearTimeout(usernameDebounceRef.current);

    if (!value || value === (user?.username || '').toLowerCase()) {
      setUsernameStatus('idle');
      return;
    }
    if (!USERNAME_PATTERN.test(value)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    usernameDebounceRef.current = setTimeout(() => {
      checkUsernameMutation.mutate(
        { username: value },
        {
          onSuccess: (response) => {
            if (!active) return;
            setUsernameStatus(response.data?.data?.available ? 'available' : 'taken');
          },
          onError: () => { if (active) setUsernameStatus('idle'); },
        }
      );
    }, 600);

    return () => { active = false; clearTimeout(usernameDebounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, user?.username]);

  // Profile picture sharing (work order item 5): after uploading a new
  // picture, offer to create a feed post with the same image file.
  const [shareCandidate, setShareCandidate] = useState(null); // { file, url }
  const createPostMutation = useCreatePost();

  const updateProfileMutation = useSettingsUpdateProfile();
  const uploadProfileMutation = useUploadProfilePicture();
  const uploadCoverMutation = useUploadCoverImage();

  const handleSave = async (e) => {
    e.preventDefault();

    // Block saving a username that is taken / invalid
    if (usernameStatus === 'taken') {
      toast.error('Username is taken');
      return;
    }
    if (!USERNAME_PATTERN.test(username.trim())) {
      toast.error('Username must be 3-30 characters (letters, numbers, underscores)');
      return;
    }

    try {
      const updates = {};
      if (fullName.trim()) updates.fullName = fullName.trim();
      const nextUsername = username.trim().toLowerCase();
      if (nextUsername && nextUsername !== (user?.username || '').toLowerCase()) {
        updates.username = nextUsername;
      }
      if (bio !== undefined) updates.bio = bio.trim();
      if (specialization) updates.specialization = specialization.trim();
      if (location) updates.location = location.trim();

      const result = await updateProfileMutation.mutateAsync(updates);
      const savedUser = result.data?.data;
      // Older API deployments silently ignored username in their field allowlist.
      // A 200 response alone must not show success for an unchanged username.
      if (updates.username && savedUser?.username !== updates.username) {
        toast.error('The server did not save your username. Please try again after the server is updated.');
        return;
      }
      if (savedUser) {
        setUser(savedUser);
      }
      toast.success(content.saveSuccess.value);
    } catch (err) {
      if (err.response?.data?.error?.code === 'USERNAME_EXISTS') {
        setUsernameStatus('taken');
        toast.error('Username is taken');
      } else {
        toast.error(err.response?.data?.error?.message || 'Failed to update');
      }
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    try {
      const result = await uploadProfileMutation.mutateAsync(file);
      if (result.data?.user) setUser({ ...user, ...result.data.user });
      // Remember the file so the user can share the new picture to their feed
      const uploadedUrl = result.data?.user?.profilePicture;
      setShareCandidate(uploadedUrl ? { file, url: uploadedUrl } : null);
    } catch {
      toast.error('Failed to upload');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    try {
      await uploadCoverMutation.mutateAsync(file);
    } catch {
      toast.error('Failed to upload');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-high border border-outline">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-bold">
              {user?.fullName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="profilePictureUpload"
            className="inline-block px-4 py-2 bg-surface-lowest border border-outline text-neutral-700 rounded-lg cursor-pointer hover:bg-surface-low transition-colors text-sm font-medium"
          >
            Change photo
          </label>
          <input
            id="profilePictureUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileUpload}
          />
        </div>
      </div>

      {/* Share the new profile picture to the feed (work order item 5) */}
      {shareCandidate && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary-200 bg-primary-50/60 p-3">
          <img
            src={shareCandidate.url}
            alt=""
            className="w-12 h-12 rounded-full object-cover border border-outline shrink-0"
          />
          <p className="flex-1 text-sm text-neutral-700">Share your new photo in your feed?</p>
          <button
            type="button"
            disabled={createPostMutation.isPending}
            onClick={async () => {
              try {
                await createPostMutation.mutateAsync({
                  content: 'Updated my profile picture ✨',
                  images: [shareCandidate.file],
                });
                toast.success('Shared to your feed 🎉');
                setShareCandidate(null);
              } catch (err) {
                toast.error(err.response?.data?.error?.message || 'Failed to share');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createPostMutation.isPending ? (
              <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
            ) : (
              <HiOutlineShare className="w-4 h-4" />
            )}
            Share to feed
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setShareCandidate(null)}
            className="p-1.5 rounded-full text-neutral-500 hover:bg-neutral-200 transition-colors"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cover Image */}
      <div>
        <label htmlFor="coverUpload" className="block text-sm font-medium text-neutral-700 mb-2">
          Cover Image
        </label>
        <label
          htmlFor="coverUpload"
          className="inline-block px-4 py-2 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-200 transition-colors text-sm font-medium"
        >
          Upload cover
        </label>
        <input
          id="coverUpload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="settingsFullName" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.fullName.value}
        </label>
        <input
          id="settingsFullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={content.fullNamePlaceholder.value}
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Username (work order item 2) */}
      <div>
        <label htmlFor="settingsUsername" className="block text-sm font-medium text-neutral-700 mb-2">
          Username
        </label>
        <div className="relative">
          <input
            id="settingsUsername"
            required
            minLength={3}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            maxLength={30}
            className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
          />
          {usernameStatus === 'checking' && (
            <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin text-neutral-400 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2" />
          )}
          {usernameStatus === 'available' && (
            <HiCheck className="w-5 h-5 text-success absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2" />
          )}
          {usernameStatus === 'taken' && (
            <HiXMark className="w-5 h-5 text-error absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
        {usernameStatus === 'available' && (
          <p className="text-caption text-success mt-1">Username is available</p>
        )}
        {usernameStatus === 'taken' && (
          <p className="text-caption text-error mt-1">Username is taken</p>
        )}
        {usernameStatus === 'invalid' && (
          <p className="text-caption text-error mt-1">
            3-30 characters — letters, numbers, and underscores only
          </p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="settingsBio" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.bio.value}
        </label>
        <textarea
          id="settingsBio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder={content.bioPlaceholder.value}
          className="w-full px-3 py-2 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 resize-none"
        />
        <p className="text-caption text-neutral-400 mt-1">{bio.length}/500</p>
      </div>

      {/* Specialization */}
      <div>
        <label htmlFor="settingsSpec" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.specialization.value}
        </label>
        <input
          id="settingsSpec"
          type="text"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder={content.specializationPlaceholder.value}
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="settingsLocation" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.location.value}
        </label>
        <input
          id="settingsLocation"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={content.locationPlaceholder.value}
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {updateProfileMutation.isPending && (
            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
          )}
          {updateProfileMutation.isPending ? content.saving.value : content.save.value}
        </button>
      </div>
    </form>
  );
}
