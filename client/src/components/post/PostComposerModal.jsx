import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiXMark, HiSparkles } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import useCreatePost from '@hooks/mutations/useCreatePost';
import useUpdatePost from '@hooks/mutations/useUpdatePost';
import useGeneratePost from '@hooks/mutations/useGeneratePost';
import PostTextarea from './PostTextarea';
import ImageUploadPreview from './ImageUploadPreview';
import TagSelector from './TagSelector';
import CommunitySelector from './CommunitySelector';
import { sanitizeContent } from '@/utils/sanitizeContent';

/**
 * Post composer modal for creating/editing posts
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.initialPost - Post object for edit mode (optional)
 * @param {string} props.initialCommunityId - Pre-selected community ID (optional)
 */
export default function PostComposerModal({ isOpen, onClose, initialPost = null, initialCommunityId = null }) {
  const content = useIntlayer('postComposer');
  const isEditMode = !!initialPost;
  
  const [postContent, setPostContent] = useState('');
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [communityId, setCommunityId] = useState(initialCommunityId);

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const generatePost = useGeneratePost();

  // Handle AI post generation
  const handleGenerateWithAI = () => {
    if (!postContent || postContent.trim().length < 5) {
      toast.error('Please write at least 5 characters to generate with AI');
      return;
    }

    generatePost.mutate(
      { text: postContent.trim() },
      {
        onSuccess: (response) => {
          if (response.success && response.data?.content) {
            setPostContent(response.data.content);
            
            // Auto-add AI generated hashtags to tags (max 5 total)
            if (response.data.hashtags && response.data.hashtags.length > 0) {
              const newTags = response.data.hashtags.filter(tag => !tags.includes(tag));
              const availableSlots = 5 - tags.length;
              if (availableSlots > 0 && newTags.length > 0) {
                setTags([...tags, ...newTags.slice(0, availableSlots)]);
              }
            }
            
            toast.success('Post enhanced with AI!');
          }
        },
        onError: (error) => {
          const errorMessage = error?.response?.data?.message || 'Failed to generate post';
          toast.error(errorMessage);
        }
      }
    );
  };

  // Initialize form with post data in edit mode
  useEffect(() => {
    if (initialPost) {
      setPostContent(initialPost.content || '');
      setImages(initialPost.images || []);
      setTags(initialPost.tags || []);
      setCommunityId(initialPost.community?._id || null);
    } else if (initialCommunityId) {
      setCommunityId(initialCommunityId);
    }
  }, [initialPost, initialCommunityId]);

  const handleAddImages = (newImages) => {
    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Sanitize content
    const sanitized = sanitizeContent(postContent);

    // Validation
    if (!sanitized && images.length === 0) {
      toast.error(content.contentRequired);
      return;
    }

    if (sanitized && sanitized.length > 5000) {
      toast.error(content.contentTooLong);
      return;
    }

    if (isEditMode) {
      // Update existing post
      updatePost.mutate(
        {
          postId: initialPost._id,
          content: sanitized || undefined,
          isrepost: !!initialPost.repostComment,
          tags: tags.length > 0 ? tags : undefined,
          communityId: initialPost.community?._id,
          authorId: initialPost.author?._id,
        },
        {
          onSuccess: () => {
            toast.success(content.updateSuccess);
            resetAndClose();
          },
          onError: (error) => {
            const errorMessage = error?.response?.data?.error?.message || content.updateFailed;
            toast.error(errorMessage);
          },
        }
      );
    } else {
      // Create new post
      const postData = {
        content: sanitized || undefined,
        images: images.length > 0 ? images : undefined,
        tags: tags.length > 0 ? tags : undefined,
        communityId: communityId || undefined,
      };

      createPost.mutate(postData, {
        onSuccess: () => {
          toast.success(content.postCreated);
          resetAndClose();
        },
        onError: (error) => {
          const errorMessage = error.deliveryUncertain ? content.deliveryUncertain : error?.response?.data?.error?.message || content.postFailed;
          toast.error(errorMessage);
        },
      });
    }
  };

  const handleClose = () => {
    if (createPost.isPending || updatePost.isPending || generatePost.isPending || createPost.isError || updatePost.isError) { onClose(); return; }
    resetAndClose();
  };

  const resetAndClose = () => {
    // Reset form
    setPostContent('');
    setImages([]);
    setTags([]);    
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl bg-neutral-200 rounded-lg shadow-elevation-3 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <DialogTitle className="text-heading-4 font-semibold text-neutral-900">
              {isEditMode ? content.editPost : content.createPost}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-neutral-100 transition-colors disabled:opacity-50"
              aria-label={content.cancel.value}
            >
              <HiXMark className="w-6 h-6 text-neutral-600" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-4">
            {/* Post content textarea */}
            <PostTextarea
              value={postContent}
              onChange={setPostContent}
              placeholder={content.writeYourPost.value}
              maxLength={5000}
            />

            {/* AI Generate button */}
            {!isEditMode && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={generatePost.isPending || postContent.trim().length < 5}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <HiSparkles className={`w-4 h-4 ${generatePost.isPending ? 'animate-spin' : ''}`} />
                  {generatePost.isPending ? 'Generating...' : 'Enhance with AI'}
                </button>
              </div>
            )}

            {/* Image upload - disabled in edit mode */}
            {!isEditMode && (
              <ImageUploadPreview
                images={images}
                onAdd={handleAddImages}
                onRemove={handleRemoveImage}
                maxImages={10}
                maxSizeMB={5}
              />
            )}

            {/* Community selector - disabled in edit mode */}
            {!isEditMode && (
              <CommunitySelector
                value={communityId}
                onChange={setCommunityId}
              />
            )}

            {/* Tag selector */}
            <TagSelector
              tags={tags}
              onChange={setTags}
              maxTags={5}
            />
          </form>

          {/* Footer note: change these buttons to Button component*/}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={createPost.isPending || updatePost.isPending}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {content.cancel}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={createPost.isPending || updatePost.isPending || (postContent.length > 5000)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isEditMode 
                ? (updatePost.isPending ? content.saving : content.save)
                : (createPost.isPending ? content.posting : content.post)
              }
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
