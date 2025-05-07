require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../controllers/usersController');
const authConfig = require('../config/auth');
const passport = require('../config/passport');

// Middleware to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    authConfig.local.secret,
    { expiresIn: '1d' }
  );
};

// User registration route
router.post('/register', async (req, res) => {
  try {
    // Check if email is already in use
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Create new user
    const newUser = new User({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      birthdate: req.body.birthdate
    });

    await newUser.save();
    
    // Generate token
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

// Login route (local authentication)
router.post('/login', async (req, res) => {
  try {
    // Find user by email
    const user = await User.findByEmail(req.body.email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou password inválidos' });
    }

    // Verify password
    const isValid = await user.comparePassword(req.body.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou password inválidos' });
    }

    // Generate token
    const token = generateToken(user);

    // Send response
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao autenticar utilizador', error: error.message });
  }
});

// Start Google authentication
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback - ajustado para incluir informações do usuário
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  function(req, res) {
    const token = generateToken(req.user);
    const userInfo = {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    };
    res.redirect(`http://localhost:7777/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userInfo))}`);
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;