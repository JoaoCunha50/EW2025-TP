const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user');
const authConfig = require('../config/auth');

// Middleware para gerar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    authConfig.local.secret,
    { expiresIn: '1d' }
  );
};

// Rota para registro de novos utilizadores
router.post('/register', async (req, res) => {
  try {
    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Criar novo utilizador
    const newUser = new User({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      birthdate: req.body.birthdate
    });

    await newUser.save();
    
    // Gerar token
    const token = generateToken(newUser);
    
    res.status(201).json({
      message: 'utilizador registrado com sucesso',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar utilizador', error: error.message });
  }
});

// Rota para login (autenticação local)
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    
    if (!user) {
      return res.status(401).json({ message: info ? info.message : 'Login falhou' });
    }
    
    // Gerar token
    const token = generateToken(user);
    
    return res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  })(req, res, next);
});

// Autenticação com Facebook - Iniciar
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Callback do Facebook após autenticação
router.get('/facebook/callback', 
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Autenticação bem-sucedida, gerar token
    const token = generateToken(req.user);
    
    // Redirecionar para frontend com token (ajuste a URL conforme necessário)
    res.redirect(`/auth-success?token=${token}`);
  }
);

// Autenticação com Google - Iniciar
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email']
}));

// Callback do Google após autenticação
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Autenticação bem-sucedida, gerar token
    const token = generateToken(req.user);
    
    // Redirecionar para frontend com token (ajuste a URL conforme necessário)
    res.redirect(`/auth-success?token=${token}`);
  }
);

// Rota para sair
router.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logout realizado com sucesso' });
});

// Rota protegida para teste
router.get('/profile', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({ 
      message: 'Acesso autorizado',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      }
    });
  }
);

module.exports = router;