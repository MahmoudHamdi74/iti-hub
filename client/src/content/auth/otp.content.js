import { t } from "intlayer";

export default {
  key: "authOtp",
  content: {
    pageTitle: t({
      en: "Verify your email",
      ar: "تأكيد البريد الإلكتروني",
    }),
    description: t({
      en: "We sent a 6-digit code to",
      ar: "أرسلنا رمز تحقق مكوّن من 6 أرقام إلى",
    }),
    otpLabel: t({
      en: "Verification code",
      ar: "رمز التحقق",
    }),
    verifyButton: t({
      en: "Verify & continue",
      ar: "تحقق ومتابعة",
    }),
    verifying: t({
      en: "Verifying...",
      ar: "جاري التحقق...",
    }),
    resendQuestion: t({
      en: "Didn't receive the code?",
      ar: "لم يصلك الرمز؟",
    }),
    resendButton: t({
      en: "Resend code",
      ar: "إعادة إرسال الرمز",
    }),
    resendSuccess: t({
      en: "A new code has been sent to your email.",
      ar: "تم إرسال رمز جديد إلى بريدك الإلكتروني.",
    }),
    backToLogin: t({
      en: "Back to login",
      ar: "العودة لتسجيل الدخول",
    }),
    invalidCode: t({
      en: "Invalid code. Please check and try again.",
      ar: "الرمز غير صحيح. يرجى المحاولة مرة أخرى.",
    }),
    expiredCode: t({
      en: "This code has expired. Please request a new one.",
      ar: "انتهت صلاحية الرمز. يرجى طلب رمز جديد.",
    }),
    networkError: t({
      en: "Network error. Please try again.",
      ar: "خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
    }),
  },
};
