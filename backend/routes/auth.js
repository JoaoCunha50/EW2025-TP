require('dotenv').config();
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../controllers/usersController');
const authConfig = require('../config/auth');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Middleware to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    authConfig.local.secret,
    { expiresIn: '1d' }
  );
};

// Google OAuth configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:7777/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      let user = await User.findByEmail(profile.emails[0].value);
      
      if (!user) {
        const newUser = {
          email: profile.emails[0].value,
          name: profile.displayName,
          password: Math.random().toString(36).slice(-8),
          google: {
            id: profile.id,
            token: accessToken
          }
        };
        
        user = await User.createUser(newUser);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

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
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Google callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:7777/login',
    session: false 
  }),
  function(req, res) {
    const token = generateToken(req.user);
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:7777/auth-success?token=${token}`);
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logout realizado com sucesso' });
});

// Protected route for profile access
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