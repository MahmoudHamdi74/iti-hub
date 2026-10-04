import { t } from "intlayer";

export default {
  key: "profile",
  content: {
    messageUser: t({ en: "Message", ar: "مراسلة" }),
    viewPhoto: t({ en: "View profile photo", ar: "عرض صورة الملف الشخصي" }),
    closePhoto: t({ en: "Close photo", ar: "إغلاق الصورة" }),
    // Profile Header
    editProfile: t({
      en: "Edit Profile",
      ar: "تعديل الملف الشخصي",
    }),
    follow: t({
      en: "Follow",
      ar: "متابعة",
    }),
    following: t({
      en: "Following",
      ar: "يتابع",
    }),
    unfollow: t({
      en: "Unfollow",
      ar: "إلغاء المتابعة",
    }),
    block: t({
      en: "Block",
      ar: "حظر",
    }),
    unblock: t({
      en: "Unblock",
      ar: "إلغاء الحظر",
    }),
    updateCoverPhoto: t({
      en: "Update Cover Photo",
      ar: "تحديث صورة الغلاف",
    }),
    updateProfilePicture: t({
      en: "Update Profile Picture",
      ar: "تحديث صورة الملف الشخصي",
    }),
    verified: t({
      en: "Verified",
      ar: "موثق",
    }),

    // Profile Info
    followers: t({
      en: "Followers",
      ar: "متابعون",
    }),
    followingCount: t({
      en: "Following",
      ar: "يتابع",
    }),
    posts: t({
      en: "Posts",
      ar: "منشورات",
    }),
    followsYou: t({
      en: "Follows You",
      ar: "يتابعك",
    }),
    bio: t({
      en: "Bio",
      ar: "السيرة الذاتية",
    }),

    // Edit Profile Form
    fullName: t({
      en: "Full Name",
      ar: "الاسم الكامل",
    }),
    fullNamePlaceholder: t({
      en: "Enter your full name",
      ar: "أدخل اسمك الكامل",
    }),
    fullNameRequired: t({
      en: "Full name is required",
      ar: "الاسم الكامل مطلوب",
    }),
    fullNameTooShort: t({
      en: "Full name must be at least 2 characters",
      ar: "يجب أن يكون الاسم الكامل على الأقل حرفين",
    }),
    fullNameTooLong: t({
      en: "Full name must be less than 50 characters",
      ar: "يجب أن يكون الاسم الكامل أقل من 50 حرفاً",
    }),
    bioPlaceholder: t({
      en: "Tell us about yourself",
      ar: "أخبرنا عن نفسك",
    }),
    bioTooLong: t({
      en: "Bio must be less than 500 characters",
      ar: "يجب أن تكون السيرة الذاتية أقل من 500 حرف",
    }),
    saving: t({
      en: "Saving...",
      ar: "جاري الحفظ...",
    }),
    profileUpdated: t({
      en: "Profile updated successfully",
      ar: "تم تحديث الملف الشخصي بنجاح",
    }),
    failedToUpdateProfile: t({
      en: "Failed to update profile",
      ar: "فشل تحديث الملف الشخصي",
    }),

    // Profile Posts
    noPosts: t({
      en: "No Posts Yet",
      ar: "لا توجد منشورات بعد",
    }),
    noPostsMessageOwn: t({
      en: "You haven't shared any posts yet. Start sharing your thoughts with the community!",
      ar: "لم تشارك أي منشورات بعد. ابدأ بمشاركة أفكارك مع المجتمع!",
    }),
    noPostsMessageOther: t({
      en: "This user hasn't shared any posts yet.",
      ar: "لم يشارك هذا المستخدم أي منشورات بعد.",
    }),
    createFirstPost: t({
      en: "Create Your First Post",
      ar: "أنشئ منشورك الأول",
    }),
    loadingPosts: t({
      en: "Loading posts...",
      ar: "جاري تحميل المنشورات...",
    }),

    // Loading & Error States
    loadingProfile: t({
      en: "Loading profile...",
      ar: "جاري تحميل الملف الشخصي...",
    }),
    errorLoadingProfile: t({
      en: "Error Loading Profile",
      ar: "خطأ في تحميل الملف الشخصي",
    }),
    userNotFound: t({
      en: "User Not Found",
      ar: "المستخدم غير موجود",
    }),
    userNotFoundMessage: t({
      en: "doesn't exist",
      ar: "غير موجود",
    }),
    userBlocked: t({
      en: "You have blocked this user",
      ar: "لقد قمت بحظر هذا المستخدم",
    }),
    userBlockedMessage: t({
      en: "You can't view this profile because you've blocked this user. Unblock them to view their profile.",
      ar: "لا يمكنك عرض هذا الملف الشخصي لأنك قمت بحظر هذا المستخدم. قم بإلغاء الحظر لعرض ملفه الشخصي.",
    }),
    tryAgain: t({
      en: "Try Again",
      ar: "حاول مرة أخرى",
    }),
    goHome: t({
      en: "Go Home",
      ar: "العودة للرئيسية",
    }),

    // Upload Messages
    uploadSuccess: t({
      en: "Upload successful!",
      ar: "تم الرفع بنجاح!",
    }),
    uploadFailed: t({
      en: "Upload failed",
      ar: "فشل الرفع",
    }),
    fileSizeError: t({
      en: "File size must be less than 5MB",
      ar: "يجب أن يكون حجم الملف أقل من 5 ميجابايت",
    }),
    fileTypeError: t({
      en: "Please select an image file",
      ar: "يرجى اختيار ملف صورة",
    }),
    profilePictureUpdated: t({
      en: "Profile picture updated!",
      ar: "تم تحديث صورة الملف الشخصي!",
    }),
    coverImageUpdated: t({
      en: "Cover image updated successfully!",
      ar: "تم تحديث صورة الغلاف بنجاح!",
    }),
    failedToUploadProfilePicture: t({
      en: "Failed to upload profile picture",
      ar: "فشل رفع صورة الملف الشخصي",
    }),
    failedToUploadCover: t({
      en: "Failed to upload cover",
      ar: "فشل رفع صورة الغلاف",
    }),

    // Follow/Block Actions
    followSuccess: t({
      en: "Followed successfully",
      ar: "تمت المتابعة بنجاح",
    }),
    unfollowSuccess: t({
      en: "Unfollowed successfully",
      ar: "تم إلغاء المتابعة بنجاح",
    }),
    blockSuccess: t({
      en: "User blocked",
      ar: "تم حظر المستخدم",
    }),
    unblockSuccess: t({
      en: "User unblocked",
      ar: "تم إلغاء حظر المستخدم",
    }),
    failedToUpdateFollowStatus: t({
      en: "Failed to update follow status",
      ar: "فشل تحديث حالة المتابعة",
    }),
    failedToUpdateBlockStatus: t({
      en: "Failed to update block status",
      ar: "فشل تحديث حالة الحظر",
    }),

    // Confirmation Messages
    confirmUnfollow: t({
      en: "Are you sure you want to unfollow this user?",
      ar: "هل أنت متأكد من إلغاء متابعة هذا المستخدم؟",
    }),
    confirmBlock: t({
      en: "Are you sure you want to block this user?",
      ar: "هل أنت متأكد من حظر هذا المستخدم؟",
    }),
    confirmUnblock: t({
      en: "Are you sure you want to unblock this user?",
      ar: "هل أنت متأكد من إلغاء حظر هذا المستخدم؟",
    }),

    // Followers & Following Lists
    followBack: t({
      en: "Follow Back",
      ar: "رد المتابعة",
    }),
    loadingFollowers: t({
      en: "Loading followers...",
      ar: "جاري تحميل المتابعين...",
    }),
    loadingFollowing: t({
      en: "Loading following...",
      ar: "جاري تحميل المتابَعين...",
    }),
    noFollowers: t({
      en: "No one follows them yet",
      ar: "لا يتابعه أحد بعد",
    }),
    noFollowersMessage: t({
      en: "When people follow this account, they'll show up here.",
      ar: "عندما يتابع الأشخاص هذا الحساب، سيظهرون هنا.",
    }),
    noFollowing: t({
      en: "Not following anyone yet",
      ar: "لا يتابع أحد بعد",
    }),
    noFollowingMessage: t({
      en: "When this account follows others, they'll show up here.",
      ar: "عندما يتابع هذا الحساب الآخرين، سيظهرون هنا.",
    }),

    // General
    loading: t({
      en: "Loading...",
      ar: "جاري التحميل...",
    }),
    cancel: t({
      en: "Cancel",
      ar: "إلغاء",
    }),
    confirm: t({
      en: "Confirm",
      ar: "تأكيد",
    }),
    save: t({
      en: "Save",
      ar: "حفظ",
    }),
    close: t({
      en: "Close",
      ar: "إغلاق",
    }),
  },
};
