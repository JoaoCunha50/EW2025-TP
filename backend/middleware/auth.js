const passport = require('passport');

// Middleware para verificar se o utilizador está autenticado
exports.isAuthenticated = passport.authenticate('jwt', { session: false });

// Middleware para verificar se o utilizador é admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    message: 'Acesso negado. Permissão de administrador necessária.'
  });
};

// Middleware para fornecer informações do utilizador atual (se estiver autenticado)
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

// Middleware que verifica se a rota é pública ou se requer autenticação
exports.checkAccess = (publicAccess = false) => {
  if (publicAccess) {
    // Rota pública, apenas adicionar utilizador se estiver autenticado
    return exports.getCurrentUser;
  } else {
    // Rota privada, exigir autenticação
    return exports.isAuthenticated;
  }
};