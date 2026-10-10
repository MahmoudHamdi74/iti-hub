import { useState } from 'react';
import { HiXMark } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { sanitizeContent } from '@/utils/sanitizeContent';

/**
 * Comment form component for posting comments
 * @param {Object} props
 * @param {string} props.postId - Post ID
 * @param {string} props.parentCommentId - Parent comment ID (for replies)
 * @param {Function} props.onSubmit - Submit handler (content) => void
 * @param {Function} props.onCancel - Cancel handler (optional, for reply forms)
 */
export default function CommentForm({ 
  onSubmit, 
  onCancel, 
}) {
    const t  = useIntlayer('commentForm');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const sanitized = sanitizeContent(content);
    if (!sanitized || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(sanitized);
      setContent(''); // Clear form on success
    } catch {
      // Error handled by mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t.placeholder.value}
        className="min-w-0 flex-1 px-3 py-2 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        rows={2}
        maxLength={1000}
        disabled={isSubmitting}
      />
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isSubmitting ? t.submitLoading : t.submit}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Cancel"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
}
