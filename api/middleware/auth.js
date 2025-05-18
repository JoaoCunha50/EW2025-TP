const passport = require('passport');

exports.isAuthenticated = passport.authenticate('jwt', { session: false });

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    message: 'Acesso negado. Permissão de administrador necessária.'
  });
};