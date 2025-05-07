const jwt = require('jsonwebtoken');
const authConfig = require('../../config/config');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    authConfig.local.secret,
    { expiresIn: '1d' }
  );
};

module.exports = {
  generateToken
};
