var express = require('express');
var router = express.Router();
var axios = require('axios');
var isAdmin = require('../middleware/auth');
const { upload, handleMulterError } = require('../multerConfig');

router.get('/login', function(req, res) {
  res.render('adminLogin', { title: 'Admin - Login' });
});

router.get('/', isAdmin, async function(req, res) {
  try{
    const response = await axios.get('http://api:3000/api/diary')
    var posts = response.data

    return res.render('adminDiario', { title: 'Admin - Dashboard', posts: posts});
  } catch (error) {
    console.error("Error:" + error);
    return res.render('adminDiario', { title: 'Admin - Dashboard'})
  }
});

router.get('/post/:id', isAdmin, async function(req, res) {
    try {
        const response = await axios.get(`http://api:3000/api/diary/${req.params.id}`)
        var post = response.data
        return res.render('post', { title: "Post", post: post, isAdmin: true})
    } catch (error) {
        console.error("Error: " + error);
        return res.redirect("/diario")
    }
});

router.get('/addpost', isAdmin, function(req, res) {
  res.render('addPost', { title: "Add Post"});
});

router.post('/addpost', isAdmin, upload.array('files'), handleMulterError, async function(req, res) {
  try {
    const files = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: "/uploads/" + file.originalname,
        type: file.mimetype,
        size: file.size
    })) : [];

    const formData = {
      title: req.body.title,
      content: req.body.content,
      tags: req.body.tags,
      isPublic: req.body.isPublic ? true : false,
      createdAt: new Date(),
      files: files 
    };

    const response = await axios.post('http://api:3000/api/diary', formData, {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`,
      }
    });

    if (response.status === 201) {
      return res.redirect('/admin');
    } else {
      return res.render('addPost', {
        title: 'Add Post',
        error: 'Failed to create post'
      });
    }
  } catch (error) {
    console.error('Error creating post:', error);
    return res.render('addPost', {
      title: 'Add Post',
      error: 'An error occurred while creating the post: ' + error.message
    });
  }
});

router.post('/login', async function(req, res, next) {
  try {
      const response = await axios.post('http://api:3000/api/auth/admin/login', {
          email: req.body.email,
          password: req.body.password
      });
      
      if (response.data.token) {
          res.cookie('token', response.data.token, {
              httpOnly: true,
              secure: false
          });
          res.cookie('user', JSON.stringify(response.data.user));
      
          if (response.data.user.role === 'admin') {
              return res.redirect('/admin');
          } 
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
