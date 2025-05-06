// Validate email format
exports.isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Validate password strength
exports.isStrongPassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};