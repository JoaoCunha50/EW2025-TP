var express = require('express');
var router = express.Router();
var axios = require('axios');
var passport = require('passport');

/* GET home page. */
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
      // Store token in cookie
      res.cookie('token', response.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      res.cookie('user', JSON.stringify(response.data.user));
      
      // Redirect based on user role
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

// GOOGLE OAUTH ROUTES
// Instead of trying to implement OAuth in the frontend directly,
// we should redirect to the backend's OAuth endpoint
router.get('/auth/google', (req, res) => {
  res.redirect('http://localhost:3000/auth/google');
});

// Handle the OAuth callback from the backend
router.get('/auth/google/callback', async (req, res) => {
  // This will be called by the backend after successful authentication
  const token = req.query.token;
  
  if (token) {
    try {
      // Verify the token and get user info
      const response = await axios.get('http://localhost:3000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Store token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      res.cookie('user', JSON.stringify(response.data.user));
      
      // Redirect based on user role
      if (response.data.user.role === 'admin') {
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
      error: 'Authentication failed - No token received'
    });
  }
});

module.exports = router;