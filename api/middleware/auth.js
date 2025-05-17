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

exports.getCurrentUser = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    
    // Se houver um utilizador autenticado, adicione-o ao objeto de solicitação
    if (user) {
      req.user = user;
    }
    
    next();
  })(req, res, next);
};

exports.checkAccess = (publicAccess = false) => {
  if (publicAccess) {
    return exports.getCurrentUser;
  } else {
    return exports.isAuthenticated;
  }
};