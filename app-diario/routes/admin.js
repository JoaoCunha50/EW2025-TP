const express = require('express');
const router = express.Router();
const axios = require('axios');
const isAdmin = require('../middleware/auth');
const { validTags } = require('../utils/utils');

router.get('/login', function(req, res) {
  res.clearCookie('token')
  res.render('adminLogin', { title: 'Admin - Login' });
});

router.get('/users', isAdmin, async function(req, res) {
  try{
    const response = await axios.get('http://api:3000/api/users', {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`
      }
    })

    if(response.status !== 200){
      throw new Error("Failed to fetch data from API");
    }

    const users = response.data;
    res.render('users', { title: 'Admin - Users', users: users });
  } catch(error){
    console.error("Error:", error);
    return res.render('users', { title: 'Admin - Users', error: 'Failed to fetch data from API' });
  }
});

router.post('/users', isAdmin, async function(req, res) {
  try {
    const response = await axios.post('http://api:3000/api/users', req.body, {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`
      }
    });

    if (response.status === 200) {
      return res.redirect('/admin/users');
    } else {
      throw new Error('Failed to create user');
    }
  } catch (error) {
    console.error("Error:", error);
    return res.redirect('/admin/users');
  }
});

router.get('/users/delete/:id', isAdmin, async function(req, res) {
  try {
    const response = await axios.delete(`http://api:3000/api/users/${req.params.id}`, {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`
      }
    });

    if (response.status === 200) {
      return res.redirect('/admin/users');
    } else {
      throw new Error('Failed to delete user');
    }
  } catch (error) {
    console.error("Error:", error);
    return res.render('users', {
      title: 'Admin - Users',
      error: 'Failed to delete user'
    });
  }
});

router.get('/', isAdmin, async function(req, res) {
    try {
      const config = {
        headers: {
            'Authorization': `Bearer ${req.cookies.token}`
        }
      };
        const [postsResponse, usersResponse] = await Promise.all([
            axios.get('http://api:3000/api/diary', config),
            axios.get('http://api:3000/api/users', config)
        ]);

        return res.render('adminDiario', { 
            title: 'Admin - Dashboard',
            posts: postsResponse.data,
            totalUsers: usersResponse.data.length,
            tags: validTags
        });
    } catch (error) {
        console.error("Error:", error);
        return res.render('adminDiario', { 
            title: 'Admin - Dashboard',
            posts: [],
            totalUsers: 0,
            error: 'Failed to fetch data from API',
            tags: validTags
        });
    }
});

router.get('/posts/add', isAdmin, function(req, res) {
  res.render('addPost', { title: "Add Post", tags: validTags });
});

router.get('/posts/:id', isAdmin, async function(req, res) {
    try {
        const email = req.cookies.email;
        const response = await axios.get(`http://api:3000/api/diary/${req.params.id}`)
        var post = response.data
        return res.render('post', { title: "Post", post: post, isAdmin: true, authenticated: true, userEmail: email});
    } catch (error) {

        console.error("Error: " + error);
        return res.redirect("/admin/diario")
    }
});

router.post('/login', async function(req, res, next) {
  try {
      const response = await axios.post('http://api:3000/auth/admin/login', {
          email: req.body.email,
          password: req.body.password
      });
      
      if (response.data.token) {
          res.cookie('token', response.data.token, {
              httpOnly: true,
              secure: false
          });
      
          return res.redirect('/admin');

      } else {
          return res.render('adminLogin', {
              title: 'Login',
              error: 'Authentication failed'
          });
      }
  } catch (error) {
      return res.render('adminLogin', {
          title: 'Login',
          error: 'Invalid credentials'
      });
  }
});

module.exports = router;
