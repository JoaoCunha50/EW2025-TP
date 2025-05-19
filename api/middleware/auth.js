const passport = require('passport');

exports.isAuthenticated = passport.authenticate('jwt', { session: false });

exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Utilizador não autenticado.'
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Acesso negado. Permissão de administrador necessária.'
  });
};