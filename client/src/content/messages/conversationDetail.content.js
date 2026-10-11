import { t, insert } from "intlayer";

export default {
  key: "conversationDetail",
  content: {
    reply: t({ en: 'Reply', ar: 'رد' }),
    replyTo: t({ en: 'Reply to', ar: 'رد على' }),
    cancelReply: t({ en: 'Cancel reply', ar: 'إلغاء الرد' }),
    // Navigation
    backToMessages: t({ en: "Back to messages", ar: "العودة إلى الرسائل" }),
    conversationInfo: t({ en: "Conversation info", ar: "معلومات المحادثة" }),

    // Message input
    messageInputPlaceholder: t({ en: "Type a message...", ar: "اكتب رسالة..." }),
    sendButton: t({ en: "Send", ar: "إرسال" }),
    sendingButton: t({ en: "Sending...", ar: "جاري الإرسال..." }),
    attachImage: t({ en: "Attach image", ar: "إرفاق صورة" }),

    // Empty states
    noMessages: t({ en: "No messages yet", ar: "لا توجد رسائل بعد" }),
    noMessagesDescription: t({
      en: "Send a message to start the conversation",
      ar: "أرسل رسالة لبدء المحادثة",
    }),

    // Loading states
    loadingMessages: t({ en: "Loading messages...", ar: "جاري تحميل الرسائل..." }),
    loadingOlderMessages: t({ en: "Loading older messages...", ar: "جاري تحميل الرسائل القديمة..." }),

    // Error messages
    errorLoadingMessages: t({
      en: "Failed to load messages",
      ar: "فشل تحميل الرسائل",
    }),
    errorSendingMessage: t({
      en: "Failed to send message",
      ar: "فشل إرسال الرسالة",
    }),
    tryAgain: t({ en: "Try again", ar: "حاول مرة أخرى" }),

    // Status labels
    typing: t({ en: "Typing...", ar: "يكتب..." }),
    typingWithName: insert({ en: "{{name}} is typing...", ar: "{{name}} يكتب..." }),
    multipleTyping: insert({
      en: "{{name}} and others are typing...",
      ar: "{{name}} وآخرون يكتبون...",
    }),
    seen: t({ en: "Seen", ar: "شوهدت" }),
    delivered: t({ en: "Delivered", ar: "تم التوصيل" }),
    sending: t({ en: "Sending...", ar: "جاري الإرسال..." }),
    failed: t({ en: "Failed to send", ar: "فشل الإرسال" }),

    // Group management
    addMembers: t({ en: "Add members", ar: "إضافة أعضاء" }),
    removeMember: t({ en: "Remove member", ar: "إزالة عضو" }),
    leaveGroup: t({ en: "Leave group", ar: "مغادرة المجموعة" }),
    editGroup: t({ en: "Edit group", ar: "تعديل المجموعة" }),
    groupName: t({ en: "Group name", ar: "اسم المجموعة" }),
    members: insert({ en: "{{count}} members", ar: "{{count}} أعضاء" }),
    member: t({ en: "1 member", ar: "عضو واحد" }),

    // Group settings panel
    groupSettingsTitle: t({ en: "Group settings", ar: "إعدادات المجموعة" }),
    searchMembersPlaceholder: t({
      en: "Search users to add...",
      ar: "ابحث عن مستخدمين للإضافة...",
    }),
    noResultsFound: t({ en: "No users found", ar: "لا يوجد مستخدمون" }),
    alreadyMembersHint: t({
      en: "Users already in this group are hidden",
      ar: "المستخدمون الأعضاء في المجموعة مخفيون",
    }),
    adminBadge: t({ en: "Admin", ar: "المسؤول" }),
    saveChanges: t({ en: "Save", ar: "حفظ" }),
    changePhoto: t({ en: "Change photo", ar: "تغيير الصورة" }),
    deleteGroupAction: t({ en: "Delete group", ar: "حذف المجموعة" }),
    confirmDeleteGroup: t({
      en: "Are you sure you want to delete this group? All messages will be lost. This cannot be undone.",
      ar: "هل أنت متأكد من حذف هذه المجموعة؟ ستفقد جميع الرسائل. لا يمكن التراجع عن هذا الإجراء.",
    }),
    confirmDelete: t({ en: "Yes, delete", ar: "نعم، احذف" }),

    // Confirmations
    confirmLeaveGroup: t({
      en: "Are you sure you want to leave this group?",
      ar: "هل أنت متأكد من مغادرة هذه المجموعة؟",
    }),
    confirmRemoveMember: insert({
      en: "Are you sure you want to remove {{user}}?",
      ar: "هل أنت متأكد من إزالة {{user}}؟",
    }),
    cancel: t({ en: "Cancel", ar: "إلغاء" }),
    confirm: t({ en: "Confirm", ar: "تأكيد" }),

    // Message actions
    deleteMessage: t({ en: "Delete message", ar: "حذف الرسالة" }),
    copyMessage: t({ en: "Copy message", ar: "نسخ الرسالة" }),
    replyToMessage: t({ en: "Reply", ar: "رد" }),

    // Time labels
    timeLabels: {
      justNow: t({ en: "Just now", ar: "الآن" }),
      minute: t({ en: "1m", ar: "1د" }),
      minutes: insert({ en: "{{count}}m", ar: "{{count}}د" }),
      hour: t({ en: "1h", ar: "1س" }),
      hours: insert({ en: "{{count}}h", ar: "{{count}}س" }),
      day: t({ en: "1d", ar: "1ي" }),
      days: insert({ en: "{{count}}d", ar: "{{count}}ي" }),
      week: t({ en: "1w", ar: "1أ" }),
      weeks: insert({ en: "{{count}}w", ar: "{{count}}أ" }),
      month: t({ en: "1mo", ar: "1ش" }),
      months: insert({ en: "{{count}}mo", ar: "{{count}}ش" }),
      year: t({ en: "1y", ar: "1س" }),
      years: insert({ en: "{{count}}y", ar: "{{count}}س" }),
    },

    // Date separators
    dateSeparators: {
      today: t({ en: "Today", ar: "اليوم" }),
      yesterday: t({ en: "Yesterday", ar: "أمس" }),
    },

    // Photo messages
    photo: t({ en: "Photo", ar: "صورة" }),
    viewPhoto: t({ en: "View photo", ar: "عرض الصورة" }),
    downloadPhoto: t({ en: "Download", ar: "تحميل" }),

    // Validation messages
    invalidImageType: t({ en: "Please select an image file", ar: "يرجى اختيار ملف صورة" }),
    imageTooLarge: t({ en: "Image size should be less than 10MB", ar: "يجب أن يكون حجم الصورة أقل من 10 ميجابايت" }),

    // Other
    you: t({ en: "You", ar: "أنت" }),
    unknownUser: t({ en: "Unknown user", ar: "مستخدم غير معروف" }),
  },
};
