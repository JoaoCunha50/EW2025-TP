var express = require('express');
var router = express.Router();
var axios = require('axios');

router.get('/', function(req, res, next) {
  res.render('home', { title: 'Diário- Home' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Diário - Login' });
});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Diário - Register' });
});

router.post('/register', async function(req, res, next) {
  try {
    const response = await axios.post('http://localhost:3000/users', {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      birthdate: req.body.birthdate,
      role: "user"
    });
    
    if (response.status === 200) {
      res.render('login', {
        title: 'Diário',
        message: 'Registration successful!'
      });
    } else {
      res.render('register', {
        title: 'Register',
        error: 'Registration failed'
      });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    res.render('register', {
      title: 'Register',
      error: error.response?.data?.error || 'Registration failed'
    });
  }
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

router.get('/profile', (req, res) => {
  res.render('profile', {
    title: 'Diário - Profile',
    user: JSON.parse(req.cookies.user)
  });
});

router.get('policy-privacy', (req, res) => {
  res.render('policy-privacy', {
    title: 'Diário - Política de Privacidade'
  });
});

module.exports = router;