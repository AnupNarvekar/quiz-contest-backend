const crypto = require('crypto');

// Generate SHA-256 hash
exports.generateSHA256Hash = (text) => {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
};