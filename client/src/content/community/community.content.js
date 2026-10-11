import { t } from 'intlayer';

export default {
  key: 'community',
  content: {
    settings: t({ en: 'Settings', ar: 'الإعدادات' }),
    communityName: t({ en: 'Community name', ar: 'اسم المجتمع' }),
    communityDetails: t({ en: 'About, members and management', ar: 'عن المجتمع والأعضاء والإدارة' }),
    backToCommunities: t({ en: 'Back to communities', ar: 'العودة للمجتمعات' }),
    // Header
    changeCoverImage: t({
      en: 'Change Cover',
      ar: 'تغيير صورة الغلاف',
    }),
    changeProfilePicture: t({
      en: 'Change Picture',
      ar: 'تغيير الصورة الشخصية',
    }),
    members: t({
      en: 'Members',
      ar: 'أعضاء',
    }),
    posts: t({
      en: 'Posts',
      ar: 'منشور',
    }),
    manageCommunity: t({
      en: 'Manage Community',
      ar: 'إدارة المجتمع',
    }),
    totalMembers: t({
      en: 'Total Members',
      ar: 'إجمالي الأعضاء',
    }),
    filterByRole: t({
      en: 'Filter by Role',
      ar: 'تصفية حسب الدور',
    }),
    all: t({
      en: 'All',
      ar: 'الكل',
    }),
    joinCommunity: t({
      en: 'Join Community',
      ar: 'انضمام للمجتمع',
    }),
    requestToJoin: t({
      en: 'Request to Join',
      ar: 'طلب الانضمام',
    }),
    requestPending: t({
      en: 'Request Pending',
      ar: 'طلبك قيد المراجعة',
    }),
    requestPendingHint: t({
      en: "Your join request is waiting for a moderator's approval",
      ar: 'طلب الانضمام بانتظار موافقة أحد المشرفين',
    }),
    joinRequestSent: t({
      en: 'Join request sent! You will be notified once reviewed.',
      ar: 'تم إرسال طلب الانضمام! سيتم إخطارك عند مراجعته.',
    }),
    cancelJoinRequest: t({
      en: 'Cancel Request',
      ar: 'إلغاء الطلب',
    }),
    joinRequestFailed: t({
      en: 'Failed to send join request',
      ar: 'فشل إرسال طلب الانضمام',
    }),
    leaveCommunity: t({
      en: 'Leave Community',
      ar: 'مغادرة المجتمع',
    }),
    manage: t({
      en: 'Manage',
      ar: 'إدارة',
    }),
    createPost: t({
      en: 'Create Post',
      ar: 'إنشاء منشور',
    }),

    // Info Section
    aboutCommunity: t({
      en: 'About Community',
      ar: 'حول المجتمع',
    }),
    editDescription: t({
      en: 'Edit Description',
      ar: 'تعديل الوصف',
    }),
    save: t({
      en: 'Save',
      ar: 'حفظ',
    }),
    cancel: t({
      en: 'Cancel',
      ar: 'إلغاء',
    }),
    noDescription: t({
      en: 'No description yet for this community.',
      ar: 'لا يوجد وصف لهذا المجتمع بعد.',
    }),
    descriptionPlaceholder: t({
      en: 'Add a description for the community...',
      ar: 'أضف وصفاً للمجتمع...',
    }),
    createdAt: t({
      en: 'Created on',
      ar: 'تم الإنشاء في',
    }),

    // Moderators
    moderators: t({
      en: 'Moderators',
      ar: 'المشرفون',
    }),
    owner: t({
      en: 'Owner',
      ar: 'المالك',
    }),
    moderator: t({
      en: 'Moderator',
      ar: 'مشرف',
    }),
    removeModerator: t({
      en: 'Remove Moderator',
      ar: 'إزالة المشرف',
    }),
    makeModerator: t({
      en: 'Make Moderator',
      ar: 'جعله مشرفاً',
    }),


    owners: t({
      en: 'Owners',
      ar: 'الملاك',
    }),

    // Members
    membersTitle: t({
      en: 'Members',
      ar: 'الأعضاء',
    }),
    membersManagement: t({
      en: 'Members Management',
      ar: 'إدارة الأعضاء',
    }),
    shown: t({
      en: 'shown',
      ar: 'معروض',
    }),
    search: t({
      en: 'Search',
      ar: 'بحث',
    }),
    searchPlaceholder: t({
      en: 'Search by name or username...',
      ar: 'ابحث بالاسم أو اسم المستخدم...',
    }),
    clear: t({
      en: 'Clear',
      ar: 'مسح',
    }),
    loadingMore: t({
      en: 'Loading more...',
      ar: 'جارٍ تحميل المزيد...',
    }),
    errorLoadingMembers: t({
      en: 'Error loading members',
      ar: 'حدث خطأ عند تحميل الأعضاء',
    }),
    noMembers: t({
      en: 'No members found',
      ar: 'لم يتم العثور على أعضاء',
    }),
    joined: t({
      en: 'Joined',
      ar: 'انضم في',
    }),
    kickMember: t({
      en: 'Remove from Community',
      ar: 'إزالة من المجتمع',
    }),

    // Join-request moderation (work order §4)
    joinRequestsTitle: t({
      en: 'Pending Join Requests',
      ar: 'طلبات الانضمام المعلقة',
    }),
    noJoinRequests: t({
      en: 'No pending join requests',
      ar: 'لا توجد طلبات انضمام معلقة',
    }),
    approve: t({ en: 'Approve', ar: 'قبول' }),
    reject: t({ en: 'Reject', ar: 'رفض' }),
    joinRequestApprovedFailed: t({
      en: 'Failed to approve request',
      ar: 'فشل قبول الطلب',
    }),
    joinRequestRejectedFailed: t({
      en: 'Failed to reject request',
      ar: 'فشل رفض الطلب',
    }),
    confirmKick: t({
      en: 'Are you sure you want to remove this member from the community?',
      ar: 'هل أنت متأكد من إزالة هذا العضو من المجتمع؟',
    }),

    // Feed
    noPosts: t({
      en: 'No posts yet',
      ar: 'لا توجد منشورات بعد',
    }),
    beFirstToPost: t({
      en: 'Be the first to post in this community',
      ar: 'كن أول من ينشر في هذا المجتمع',
    }),
    loadMore: t({
      en: 'Load More',
      ar: 'عرض المزيد',
    }),
    loading: t({
      en: 'Loading...',
      ar: 'جاري التحميل...',
    }),

    // Interactions
    like: t({
      en: 'Like',
      ar: 'إعجاب',
    }),
    comment: t({
      en: 'Comment',
      ar: 'تعليق',
    }),
    savee: t({
      en: 'Save',
      ar: 'حفظ',
    }),
    share: t({
      en: 'Share',
      ar: 'مشاركة',
    }),

    // Stats
    likesCount: t({
      en: 'likes',
      ar: 'إعجاب',
    }),
    commentsCount: t({
      en: 'comments',
      ar: 'تعليق',
    }),
    sharesCount: t({
      en: 'shares',
      ar: 'مشاركة',
    }),

    // Errors
    errorOccurred: t({
      en: 'An error occurred',
      ar: 'حدث خطأ',
    }),
    communityNotFound: t({
      en: 'Community not found',
      ar: 'لم يتم العثور على المجتمع',
    }),
  },
};
