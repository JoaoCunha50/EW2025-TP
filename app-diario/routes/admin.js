const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const isAdmin = require('../middleware/auth');
const { validTags } = require('../utils/utils');

const publicDir = path.join(__dirname, '..', 'public');

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
})

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
            totalUsers: usersResponse.data.length
        });
    } catch (error) {
        console.error("Error:", error);
        return res.render('adminDiario', { 
            title: 'Admin - Dashboard',
            posts: [],
            totalUsers: 0,
            error: 'Failed to fetch data from API'
        });
    }
});

router.get('/posts/add', isAdmin, function(req, res) {
  res.render('addPost', { title: "Add Post", tags: validTags, token: req.cookies.token });
});

router.get('/posts/:id', isAdmin, async function(req, res) {
    try {
        const response = await axios.get(`http://api:3000/api/diary/${req.params.id}`)
        var post = response.data
        return res.render('post', { title: "Post", post: post, isAdmin: true, token: req.cookies.token });
    } catch (error) {
        console.error("Error: " + error);
        return res.redirect("/diario")
    }
});

router.delete('/posts/delete/:id', isAdmin, async function(req, res) {
  try {
    const postId = req.params.id;
    
    const postResponse = await axios.get(`http://api:3000/api/diary/${postId}`,{
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`,
      }
    });
    const post = postResponse.data;
    
    if (post.files && post.files.length > 0) {
      for (const file of post.files) {
        fs.rmSync(path.dirname(path.join(publicDir, file.path)),{ recursive: true, force: true })
        break;
      }
      console.log(`All files for post ${postId} have been deleted`);
    }

    const response = await axios.delete(`http://api:3000/api/diary/${postId}`, {
        headers: {
          'Authorization': `Bearer ${req.cookies.token}`
        } 
    });

    if(response.status === 200){
      return res.status(200).json({ message: 'Files deleted successfully' });
    } else {
      throw new Error("Delete was not successfull")
    }
    
  } catch (error) {
    console.error('Error deleting post files:', error);
    return res.status(500).json({ error: 'Failed to delete post files' });
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
