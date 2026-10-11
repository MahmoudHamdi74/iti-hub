import { t } from "intlayer";

export default {
  key: "postComposer",
  content: {
    deliveryUncertain: t({ en: 'Connection interrupted. We could not confirm publishing. Your draft is kept; retry the same post safely when connected.', ar: 'الاتصال انقطع ولم نتمكن من تأكيد النشر. مسودتك محفوظة؛ يمكنك إعادة المحاولة بنفس المحتوى بعد عودة الاتصال.' }),
    // Modal title
    createPost: t({ en: "Create Post", ar: "إنشاء منشور" }),
    editPost: t({ en: "Edit Post", ar: "تعديل منشور" }),
    
    // Form labels
    postContent: t({ en: "What's on your mind?", ar: "ما الذي يدور في ذهنك؟" }),
    selectCommunity: t({ en: "Select Community (Optional)", ar: "اختر المجتمع (اختياري)" }),
    addTags: t({ en: "Add Tags", ar: "إضافة وسوم" }),
    addImages: t({ en: "Add Images", ar: "إضافة صور" }),
    
    // Placeholders
    writeYourPost: t({ en: "Write your post...", ar: "اكتب منشورك..." }),
    enterTag: t({ en: "Enter tag...", ar: "أدخل وسم..." }),
    noCommunities: t({ en: "No communities joined", ar: "لم تنضم إلى أي مجتمعات" }),
    selectOption: t({ en: "Select an option", ar: "اختر خيارًا" }),
    
    // Buttons
    post: t({ en: "Post", ar: "نشر" }),
    posting: t({ en: "Posting...", ar: "جاري النشر..." }),
    save: t({ en: "Save", ar: "حفظ" }),
    saving: t({ en: "Saving...", ar: "جاري الحفظ..." }),
    cancel: t({ en: "Cancel", ar: "إلغاء" }),
    update: t({ en: "Update", ar: "تحديث" }),
    
    // Image upload
    addImage: t({ en: "Add Image", ar: "إضافة صورة" }),
    removeImage: t({ en: "Remove", ar: "إزالة" }),

    loadingCommunities: t({ en: "Loading communities...", ar: "جارٍ تحميل المجتمعات..." }),
    
    // Validation messages
    contentRequired: t({ en: "Please write something or add an image", ar: "الرجاء كتابة شيء أو إضافة صورة" }),
    contentTooLong: t({ en: "Post is too long (max 5000 characters)", ar: "المنشور طويل جدًا (الحد الأقصى 5000 حرف)" }),
    tooManyImages: t({ en: "Maximum 10 images allowed", ar: "الحد الأقصى 10 صور" }),
    tooManyTags: t({ en: "Maximum 5 tags allowed", ar: "الحد الأقصى 5 وسوم" }),
    imageTooLarge: t({ en: "Image too large (max 5MB)", ar: "الصورة كبيرة جدًا (الحد الأقصى 5 ميجابايت)" }),
    invalidImageType: t({ en: "Invalid image type. Use JPEG, PNG, or WebP", ar: "نوع صورة غير صالح. استخدم JPEG أو PNG أو WebP" }),
    
    // Success messages
    postCreated: t({ en: "Post created successfully!", ar: "تم إنشاء المنشور بنجاح!" }),
    postUpdated: t({ en: "Post updated successfully!", ar: "تم تحديث المنشور بنجاح!" }),
    
    // Error messages
    postFailed: t({ en: "Failed to create post", ar: "فشل إنشاء المنشور" }),
    updateFailed: t({ en: "Failed to update post", ar: "فشل تحديث المنشور" }),
    
    // Character count
    charactersLeft: t({ en: "characters left", ar: "حرف متبقي" }),
    charactersOver: t({ en: "characters over limit", ar: "حرف زائد عن الحد" }),
  }
};
