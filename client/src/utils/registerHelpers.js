/**
 * Generate username suggestions based on email
 * @param {string} email - User's email address
 * @returns {string[]} Array of username suggestions
 */
export function generateUsernameSuggestions(email) {
  if (!email || !email.includes('@')) {
    return [];
  }

  const localPart = email.split('@')[0];
  const cleanBase = localPart.replace(/[^a-zA-Z0-9]/g, '');
  
  if (cleanBase.length < 3) {
    return [];
  }

  const suggestions = [];
  
  // Suggestion 1: Clean base name
  suggestions.push(cleanBase.toLowerCase());
  
  // Suggestion 2: Base name with random 2-digit number
  const random2Digit = Math.floor(Math.random() * 90) + 10;
  suggestions.push(`${cleanBase.toLowerCase()}${random2Digit}`);
  
  // Suggestion 3: Base name with random 3-digit number
  const random3Digit = Math.floor(Math.random() * 900) + 100;
  suggestions.push(`${cleanBase.toLowerCase()}${random3Digit}`);
  
  // Suggestion 4: Base name with underscore and random number
  const random4Digit = Math.floor(Math.random() * 9000) + 1000;
  suggestions.push(`${cleanBase.toLowerCase()}_${random4Digit}`);
  
  // Suggestion 5: First 3 chars + random string
  if (cleanBase.length >= 3) {
    const prefix = cleanBase.substring(0, 3).toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    suggestions.push(`${prefix}${randomSuffix}`);
  }

  // Match the server's username length limit.
  return suggestions
    .filter(s => s.length >= 3 && s.length <= 30)
    .slice(0, 5);
}

/**
 * Validate password against policy requirements
 * @param {string} password - Password to validate
 * @returns {object} Validation result with individual checks
 */
export function validatePassword(password) {
  return {
    minLength: password.length >= 8,
    hasLetter: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

/**
 * Check if password meets all policy requirements
 * @param {string} password - Password to check
 * @returns {boolean} True if password is valid
 */
export function isPasswordValid(password) {
  const checks = validatePassword(password);
  return Object.values(checks).every(check => check === true);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {object} Validation result
 */
export function validateUsername(username) {
  const validFormat = /^[a-zA-Z0-9_]+$/.test(username);
  const validLength = username.length >= 3 && username.length <= 30;
  
  return {
    valid: validFormat && validLength,
    validFormat,
    validLength,
  };
}
