/**
 * Email template utilities for itiHub
 * Provides consistent, professional email templates with branding
 */

/**
 * Base HTML email template with itiHub branding
 * @param {Object} options
 * @param {string} options.title - Email title
 * @param {string} options.preheader - Preview text shown in email clients
 * @param {string} options.heading - Main heading in email body
 * @param {string} options.body - HTML content for email body
 * @param {string} options.buttonText - CTA button text (optional)
 * @param {string} options.buttonUrl - CTA button URL (optional)
 * @param {string} options.footerText - Additional footer text (optional)
 * @returns {string} Complete HTML email
 */
const createEmailTemplate = ({
  title,
  preheader = '',
  heading,
  body,
  buttonText = null,
  buttonUrl = null,
  footerText = ''
}) => {
  const buttonHtml = buttonText && buttonUrl ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${buttonUrl}" 
             style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; line-height: 24px;">
            ${buttonText}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${preheader}
  </div>
  
  <!-- Email container -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main content card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header with logo -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="cid:iti-hub-logo" alt="ITI Hub" width="180" height="180" style="display:block; margin:0 auto; border:0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Heading -->
              <h1 style="margin: 0 0 24px; font-size: 28px; font-weight: 700; color: #171717; line-height: 1.3;">
                ${heading}
              </h1>
              
              <!-- Body text -->
              <div style="margin: 0 0 24px; font-size: 16px; color: #525252; line-height: 1.6;">
                ${body}
              </div>

              <!-- CTA Button -->
              ${buttonHtml}

              <!-- Footer text in body -->
              ${footerText ? `
                <div style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #737373; line-height: 1.6;">
                  ${footerText}
                </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5; border-radius: 0 0 12px 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; color: #737373; line-height: 1.6; text-align: center;">
                    <p style="margin: 0 0 8px;">
                      This email was sent by <strong>itiHub</strong>
                    </p>
                    <p style="margin: 0; color: #a3a3a3;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        
        <!-- Email footer outside card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px;">
          <tr>
            <td style="text-align: center; font-size: 12px; color: #a3a3a3; line-height: 1.6;">
              <p style="margin: 0;">
                © ${new Date().getFullYear()} itiHub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Email template for email verification
 * @param {string} verificationUrl - Full URL with token
 * @param {string} userName - User's name for personalization (optional)
 * @returns {string} HTML email
 */
const getEmailVerificationTemplate = (verificationUrl, userName = '') => {
  const greeting = userName ? `Hi ${userName}` : 'Welcome';
  
  return createEmailTemplate({
    title: 'Verify Your Email - itiHub',
    preheader: 'Please verify your email address to complete your registration.',
    heading: `${greeting}! 👋`,
    body: `
      <p style="margin: 0 0 16px;">Thank you for joining <strong>itiHub</strong>! We're excited to have you as part of our community.</p>
      <p style="margin: 0 0 16px;">To get started and access all features, please verify your email address by clicking the button below:</p>
    `,
    buttonText: 'Verify Email Address',
    buttonUrl: verificationUrl,
    footerText: `
      <p style="margin: 0 0 8px;"><strong>This verification link will expire in 24 hours.</strong></p>
      <p style="margin: 0;">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="margin: 8px 0 0; word-break: break-all; color: #2563eb;">
        <a href="${verificationUrl}" style="color: #2563eb; text-decoration: none;">${verificationUrl}</a>
      </p>
    `
  });
};

/**
 * Email template for password reset request
 * @param {string} resetUrl - Full URL with token
 * @param {string} userName - User's name for personalization (optional)
 * @returns {string} HTML email
 */
const getPasswordResetTemplate = (resetUrl, userName = '') => {
  const greeting = userName ? `Hi ${userName}` : 'Hello';
  
  return createEmailTemplate({
    title: 'Reset Your Password - itiHub',
    preheader: 'You requested to reset your password. Click to create a new one.',
    heading: `${greeting}`,
    body: `
      <p style="margin: 0 0 16px;">We received a request to reset your password for your <strong>itiHub</strong> account.</p>
      <p style="margin: 0 0 16px;">Click the button below to set a new password:</p>
    `,
    buttonText: 'Reset Password',
    buttonUrl: resetUrl,
    footerText: `
      <p style="margin: 0 0 8px;"><strong>This password reset link will expire in 1 hour.</strong></p>
      <p style="margin: 0 0 16px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <p style="margin: 0;">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="margin: 8px 0 0; word-break: break-all; color: #2563eb;">
        <a href="${resetUrl}" style="color: #2563eb; text-decoration: none;">${resetUrl}</a>
      </p>
    `
  });
};

/**
 * Email template for password reset confirmation
 * @param {string} userName - User's name for personalization (optional)
 * @returns {string} HTML email
 */
const getPasswordResetConfirmationTemplate = (userName = '') => {
  const greeting = userName ? `Hi ${userName}` : 'Hello';
  
  return createEmailTemplate({
    title: 'Password Changed Successfully - itiHub',
    preheader: 'Your password has been changed successfully.',
    heading: `${greeting}`,
    body: `
      <p style="margin: 0 0 16px;">Your password for <strong>itiHub</strong> has been successfully changed.</p>
      <p style="margin: 0 0 16px;">If you made this change, no further action is needed.</p>
      <p style="margin: 0;"><strong>If you didn't make this change, please contact our support team immediately.</strong></p>
    `,
    buttonText: 'Go to Login',
    buttonUrl: `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/login`
  });
};

/**
 * Email template for the registration OTP code
 * @param {string} otp - 6-digit verification code
 * @param {string} userName - User's name for personalization (optional)
 * @returns {string} HTML email
 */
const getOtpEmailTemplate = (otp, userName = '') => {
  const greeting = userName ? `Hi ${userName}` : 'Hello';

  return createEmailTemplate({
    title: 'Your Verification Code - itiHub',
    preheader: `Your itiHub verification code is ${otp}`,
    heading: `${greeting}! 👋`,
    body: `
      <p style="margin: 0 0 16px;">Welcome to <strong>itiHub</strong>! Use the verification code below to confirm your email address:</p>
      <div style="margin: 28px 0; text-align: center;">
        <span style="display: inline-block; padding: 18px 30px; background-color: #f5f7ff; border: 1px solid #d6dcff; border-radius: 12px; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #2563eb;">${otp}</span>
      </div>
      <p style="margin: 0 0 16px;">Enter this code in the app to finish creating your account.</p>
    `,
    footerText: `
      <p style="margin: 0 0 8px;"><strong>This code will expire in 10 minutes.</strong></p>
      <p style="margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
    `
  });
};

module.exports = {
  createEmailTemplate,
  getEmailVerificationTemplate,
  getOtpEmailTemplate,
  getPasswordResetTemplate,
  getPasswordResetConfirmationTemplate
};
