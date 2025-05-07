var express = require('express');
var router = express.Router();
var axios = require('axios');
var passport = require('passport');

router.get('/', function(req, res, next) {
  res.render('home', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Express' });
});

router.post('/login', async function(req, res, next) {
  try {
    const response = await axios.post('http://localhost:3000/auth/login', {
      email: req.body.email,
      password: req.body.password
    });
    
    if (response.data.token) {
      res.cookie('token', response.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      res.cookie('user', JSON.stringify(response.data.user));
      
      if (response.data.user.role === 'admin') {
        res.redirect('/admin');
      } else {
        res.redirect('/profile');
      }
    } else {
      res.render('login', {
        title: 'Login',
        error: 'Authentication failed'
      });
    }
  } catch (error) {
    res.render('login', {
      title: 'Login',
      error: 'Invalid credentials'
    });
  }
});

router.get('/auth/google', (req, res) => {
  res.redirect('http://localhost:3000/auth/google');
});

// Handle the OAuth callback from the backend - simplificado
router.get('/auth/google/callback', (req, res) => {
  const { token, user } = req.query;
  
  if (token && user) {
    try {
      const userData = JSON.parse(decodeURIComponent(user));
      
      // Store token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      res.cookie('user', user);
      
      // Redirect based on user role
      if (userData.role === 'admin') {
        res.redirect('/admin');
      } else {
        res.redirect('/profile');
      }
    } catch (error) {
      res.render('login', {
        title: 'Login',
        error: 'Authentication failed'
      });
    }
  } else {
    res.render('login', {
      title: 'Login',
      error: 'Authentication failed - No token or user data received'
    });
  }
});

module.exports = router;