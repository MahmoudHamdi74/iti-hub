const { APIError } = require('./errors');

module.exports = function frontendUrl(pathname, parameters) {
  let url;
  try {
    url = new URL(pathname, process.env.FRONTEND_BASE_URL);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new APIError('Email delivery is temporarily unavailable. Please try again later.', 503, 'FRONTEND_URL_NOT_CONFIGURED');
  }
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  return url.toString();
};
