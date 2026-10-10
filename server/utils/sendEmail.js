const nodemailer = require('nodemailer');
const path = require('path');
const { APIError } = require('./errors');

function createEmailTransport() {
  for (const key of ['EMAIL_SERVICE', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM_ADDRESS']) {
    if (!process.env[key]?.trim()) throw new APIError('Email delivery is temporarily unavailable. Please try again later.', 503, 'EMAIL_NOT_CONFIGURED');
  }
  const gmail = process.env.EMAIL_SERVICE.trim().toLowerCase() === 'gmail';
  const port = Number(process.env.EMAIL_SMTP_PORT || 587);
  const options = gmail ? {
    host: 'smtp.gmail.com', port, secure: port === 465, requireTLS: port !== 465,
  } : { service: process.env.EMAIL_SERVICE };
  return nodemailer.createTransport({
    ...options,
    auth: { user: process.env.EMAIL_USER.trim(), pass: gmail ? process.env.EMAIL_PASSWORD.replace(/\s/g, '') : process.env.EMAIL_PASSWORD },
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 15000,
  });
}

/**
 * Send an email through the SMTP service configured in the environment.
 * @param {Object} options
 * @param {string|string[]} options.to - Receiver email(s)
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<{id: string}>} Message id on success
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // Preserve the existing test-mode behavior: never send real emails.
  if (process.env.NODE_ENV === 'test') {
    return { id: 'test-mode-no-send' };
  }

  // Read configuration at send time because app.js loads dotenv after imports.
  const transporter = createEmailTransport();

  const result = await transporter.sendMail({
    from: { name: 'ITI Hub', address: process.env.EMAIL_FROM_ADDRESS.trim() },
    to,
    subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
    ...(html?.includes('cid:iti-hub-logo') ? {
      attachments: [{
        filename: 'logo.png',
        path: path.join(__dirname, '../assets/logo.png'),
        cid: 'iti-hub-logo',
        contentDisposition: 'inline',
      }],
    } : {}),
  });

  if (result.rejected?.length) throw new APIError('Email delivery is temporarily unavailable. Please try again later.', 503, 'EMAIL_DELIVERY_FAILED');
  return { id: result.messageId };
};

module.exports = sendEmail;
module.exports.createEmailTransport = createEmailTransport;
