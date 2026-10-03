import { t } from "intlayer";

export default {
  key: "authGoogle",
  content: {
    popupHelp: t({ en: "If Google does not open, allow pop-ups for this site or sign in with email.", ar: "لو نافذة Google مش بتفتح، اسمح بالنوافذ المنبثقة للموقع أو سجّل دخول بالإيميل." }),
    errorUnavailable: t({ en: "Google Sign-In could not load. Please use email or try again later.", ar: "تعذّر تحميل تسجيل الدخول بـGoogle. استخدم الإيميل أو حاول مرة أخرى لاحقًا." }),
    orContinueWith: t({
      en: "or continue with",
      ar: "أو المتابعة باستخدام",
    }),
    buttonLabel: t({
      en: "Continue with Google",
      ar: "المتابعة باستخدام Google",
    }),
    errorNotConfigured: t({
      en: "Google Sign-In is not configured on this device.",
      ar: "تسجيل الدخول عبر Google غير مُهيأ على هذا الجهاز.",
    }),
  },
};
