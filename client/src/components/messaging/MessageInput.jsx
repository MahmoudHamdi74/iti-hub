import { useState, useRef, useEffect } from 'react';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { HiOutlinePaperAirplane, HiOutlinePhoto, HiOutlineXMark } from 'react-icons/hi2';
import Button from '@/components/common/Button';

/**
 * @fileoverview Message input component with text and image support
 * Handles typing indicators and auto-expanding textarea
 */

/**
 * MessageInput - Input field for sending messages
 * 
 * @param {Object} props
 * @param {string} props.value - Current text value
 * @param {Function} props.onChange - Callback when text changes
 * @param {Function} props.onSend - Callback to send message
 * @param {Function} [props.onTyping] - Callback for typing indicator
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {boolean} [props.sending=false] - Whether message is being sent
 * @returns {JSX.Element}
 */
export function MessageInput({
  value = '',
  onChange,
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
  sending = false,
}) {
  const content = useIntlayer('conversationDetail');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120); // Max 5 lines
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > 120 ? 'auto' : 'hidden';
    }
  }, [value]);
  
    // Refocus textarea after sending completes and input is cleared
    const prevSendingRef = useRef(sending);
    useEffect(() => {
      if (prevSendingRef.current && !sending && value === '' && textareaRef.current) {
        textareaRef.current.focus();
      }
      prevSendingRef.current = sending;
    }, [sending, value]);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(content.invalidImageType?.value || 'Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(content.imageTooLarge?.value || 'Image must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle send
  const handleSend = async () => {
    if (disabled || sending) return;
    if (!value.trim() && !selectedImage) return;

    try { await onSend({
      content: value.trim(),
      image: selectedImage,
    });

    // Reset state
    onChange('');
    handleRemoveImage();
    } catch { /* Keep draft after a failed send. */ }
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle text change
  const handleChange = (e) => {
    onChange(e.target.value);
    onTyping?.();
  };

  const canSend = (value.trim() || selectedImage) && !disabled && !sending;

  return (
    <div className="shrink-0 border-t border-outline bg-neutral-100 pb-[env(safe-area-inset-bottom)]">
      {replyTo && <div className="flex items-center gap-2 px-4 pt-3 text-sm" role="status"><div className="min-w-0 flex-1 border-s-2 border-primary-500 ps-3"><strong>{content.replyTo?.value || 'Reply to'} {replyTo.sender?.username}</strong><p className="truncate">{replyTo.content || content.photo?.value}</p></div><button type="button" aria-label={content.cancelReply?.value || 'Cancel reply'} onClick={onCancelReply}><HiOutlineXMark className="h-5 w-5" /></button></div>}
      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 pt-3 pb-2">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-24 w-auto rounded-lg object-cover"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -end-2 bg-neutral-800 text-white rounded-full p-1 hover:bg-neutral-900 transition-colors"
              aria-label="Remove image"
            >
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2 p-3 sm:p-4 mx-auto w-full max-w-4xl">
        {/* Image Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          className="shrink-0 p-3 text-neutral-600 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={content.attachImage.value}
        >
          <HiOutlinePhoto className="w-6 h-6" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder={content.messageInputPlaceholder.value}
          rows={1}
          className="
            flex-1 min-w-0 resize-none
            px-4 py-3
            bg-surface-high
            border border-transparent
            rounded-xl
            text-base
            placeholder:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-neutral-100
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          loading={sending}
          variant="primary"
          className="shrink-0 rounded-full! p-2! h-12! w-12!"
          aria-label={content.sendButton.value}
        >
          {!sending && <HiOutlinePaperAirplane className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}

export default MessageInput;
