import { t } from "intlayer";

export default {
  key: "authRegister",
  content: {
    pageTitle: t({
      en: "Create Your Account",
      ar: "إنشاء حسابك",
    }),
    
    // Step 1 - Email
    step1Title: t({
      en: "Enter Your Email",
      ar: " البريد الإلكتروني الخاص بك",
    }),
    emailLabel: t({
      en: "Email Address",
      ar: "عنوان البريد الإلكتروني",
    }),
    emailPlaceholder: t({
      en: "your.email@example.com",
      ar: "your.email@example.com",
    }),
    emailHint: t({
      en: "We'll send you a confirmation email",
      ar: "سنرسل لك بريدًا إلكترونيًا للتأكيد",
    }),
    
    // Step 2 - Username
    step2Title: t({
      en: " Choose Username",
      ar: "اختر اسم المستخدم",
    }),
    usernameLabel: t({
      en: "Username",
      ar: "اسم المستخدم",
    }),
    usernamePlaceholder: t({
      en: "username",
      ar: "اسم المستخدم",
    }),
    usernameHint: t({
      en: "3-30 characters, letters, numbers and underscores only",
      ar: "3-30 حرفًا، أحرف وأرقام وشرطة سفلية فقط",
    }),
    suggestionsTitle: t({
      en: "Suggestions:",
      ar: "اقتراحات:",
    }),
    checkingAvailability: t({
      en: "Checking availability...",
      ar: "جاري التحقق من التوفر...",
    }),
    usernameAvailable: t({
      en: "Username is available",
      ar: "اسم المستخدم متاح",
    }),
    usernameTaken: t({
      en: "Username is already taken",
      ar: "اسم المستخدم مستخدم بالفعل",
    }),
    
    // Step 3 - Profile
    step3Title: t({
      en: " Complete Your Profile",
      ar: " أكمل ملفك الشخصي",
    }),
    firstNameLabel: t({
      en: "First Name",
      ar: "الاسم الأول",
    }),
    firstNamePlaceholder: t({
      en: "Mohamed",
      ar: "محمد",
    }),
    lastNameLabel: t({
      en: "Last Name",
      ar: "اسم العائلة",
    }),
    lastNamePlaceholder: t({
      en: "Ahmed",
      ar: "أحمد",
    }),
    passwordLabel: t({
      en: "Password",
      ar: "كلمة المرور",
    }),
    passwordPlaceholder: t({
      en: "Create a strong password",
      ar: "أنشئ كلمة مرور قوية",
    }),
    confirmPasswordLabel: t({
      en: "Confirm Password",
      ar: "تأكيد كلمة المرور",
    }),
    confirmPasswordPlaceholder: t({
      en: "Re-enter your password",
      ar: "أعد إدخال كلمة المرور",
    }),
    
    // Password Policy
    passwordPolicyTitle: t({
      en: "Password must contain:",
      ar: "يجب أن تحتوي كلمة المرور على:",
    }),
    policyMinLength: t({
      en: "At least 8 characters",
      ar: "8 أحرف على الأقل",
    }),
    policyLetter: t({
      en: "At least one lowercase letter",
      ar: "حرف إنجليزي صغير واحد على الأقل",
    }),
    policyNumber: t({
      en: "At least one number",
      ar: "رقم واحد على الأقل",
    }),
    policySpecial: t({
      en: "At least one special character (!@#$%^&*)",
      ar: "حرف خاص واحد على الأقل (!@#$%^&*)",
    }),
    
    // Buttons
    nextButton: t({
      en: "Next",
      ar: "التالي",
    }),
    backButton: t({
      en: "Back",
      ar: "رجوع",
    }),
    submitButton: t({
      en: "Create Account",
      ar: "إنشاء حساب",
    }),
    submittingButton: t({
      en: "Creating...",
      ar: "جاري الإنشاء...",
    }),
    
    // Links
    haveAccount: t({
      en: "Already have an account?",
      ar: "لديك حساب بالفعل؟",
    }),
    loginLink: t({
      en: "Login",
      ar: "تسجيل الدخول",
    }),
    
    // Errors
    errorEmailTaken: t({
      en: "This email is already registered",
      ar: "هذا البريد الإلكتروني مسجل بالفعل",
    }),
    errorEmailInvalid: t({
      en: "Please enter a valid email address",
      ar: "يرجى إدخال عنوان بريد إلكتروني صالح",
    }),
    errorUsernameInvalid: t({
      en: "Username can only contain letters, numbers and underscores",
      ar: "يمكن أن يحتوي اسم المستخدم على أحرف وأرقام وشرطة سفلية فقط",
    }),
    errorUsernameLength: t({
      en: "Username must be between 3 and 30 characters",
      ar: "يجب أن يكون اسم المستخدم بين 3 و 30 حرفًا",
    }),
    errorUsernameTaken: t({
      en: "Username is taken",
      ar: "اسم المستخدم محجوز",
    }),
    errorPasswordMatch: t({
      en: "Passwords do not match",
      ar: "كلمات المرور غير متطابقة",
    }),
    errorPasswordPolicy: t({
      en: "Password does not meet requirements",
      ar: "كلمة المرور لا تستوفي المتطلبات",
    }),
    errorNetwork: t({
      en: "Network error. Please try again.",
      ar: "خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
    }),
    errorTooManyRequests: t({
      en: "Too many attempts. Please try again in {minutes} minutes.",
      ar: "محاولات كثيرة جدًا. يرجى المحاولة مرة أخرى بعد {minutes} دقيقة.",
    }),
    cooldownMessage: t({
      en: "Please wait {time} before trying again.",
      ar: "يرجى الانتظار {time} قبل المحاولة مرة أخرى.",
    }),
  },
};
