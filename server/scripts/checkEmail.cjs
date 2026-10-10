const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { createEmailTransport } = require('../utils/sendEmail');

(async () => {
  const keys = ['EMAIL_SERVICE', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM_ADDRESS', 'FRONTEND_BASE_URL'];
  console.log(JSON.stringify({ nodeEnv: process.env.NODE_ENV || '(unset)', configured: Object.fromEntries(keys.map(key => [key, Boolean(process.env[key]?.trim())])) }));
  if (process.env.NODE_ENV === 'test') throw Object.assign(new Error(), { code: 'TEST_MODE_DISALLOWS_DELIVERY' });
  const transport = createEmailTransport();
  if (process.argv.includes('--verify')) {
    await transport.verify();
    console.log('SMTP connection and authentication succeeded. No email was sent; this does not verify inbox delivery.');
  } else {
    console.log('Configuration valid. Add --verify to test SMTP connectivity and authentication without sending mail.');
  }
  transport.close();
})().catch(error => {
  console.error(JSON.stringify({ code: error.code || 'EMAIL_CHECK_FAILED', command: error.command, responseCode: error.responseCode }));
  process.exitCode = 1;
});
