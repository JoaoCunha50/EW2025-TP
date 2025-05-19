const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const isAdmin = require('../middleware/auth');
const { validateManifestFiles, processFiles, extractZip } = require('../utils/utils');

const { 
  uploadSip, 
  handleMulterError, 
  tempDir, 
  publicDir
} = require('../utils/multerConfig');

router.get('/login', function(req, res) {
  res.clearCookie('token')
  res.render('adminLogin', { title: 'Admin - Login' });
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
            error: null
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

router.get('/add/post', isAdmin, function(req, res) {
  res.render('addPost', { title: "Add Post"});
});

router.post('/add/post', isAdmin, uploadSip.single('sipFile'), handleMulterError, async function(req, res) {
  try {
    if (!req.file) {
      return res.render('addPost', {
        title: 'Add Post',
        error: 'No SIP file uploaded'
      });
    }
    const user = req.user;

    const zipFilePath = req.file.path;
    
    const extractDir = path.join(tempDir, Date.now().toString());
    fs.mkdirSync(tempDir, { recursive: true });

    await extractZip(zipFilePath, { dir: extractDir });

    fs.unlinkSync(path.join(tempDir, req.zipInfo.filename))

    const manifestPath = path.join(extractDir, 'manifesto-SIP.json');
    
    if (!fs.existsSync(manifestPath)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      
      return res.render('addPost', {
        title: 'Add Post',
        error: 'Invalid SIP: Missing manifesto-SIP.json file'
      });
    }
    
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    let manifest;
    
    try {
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      
      return res.render('addPost', {
        title: 'Add Post',
        error: 'Invalid SIP: The manifest file contains invalid JSON'
      });
    }
    
    // Validate that all files referenced in the manifest exist
    const filesExist = validateManifestFiles(manifest, extractDir);
    
    if (!filesExist) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      
      return res.render('addPost', {
        title: 'Add Post',
        error: 'Invalid SIP: Not all files referenced in the manifest exist in the package'
      });
    }
    
    const files = await processFiles(manifest, extractDir);
    
    const formData = {
      producer: user.email,
      title: manifest.title || 'Untitled Post',
      content: manifest.content || '',
      tags: manifest.tags || [],
      isPublic: manifest.isPublic === true,
      createdAt: manifest.createdAt ? new Date(manifest.createdAt) : new Date(),
      files: files,
      comments: []
    };

    const response = await axios.post('http://api:3000/api/diary', formData, {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`,
      }
    });

    fs.rmSync(extractDir, { recursive: true, force: true });
    
    if (response.status === 201) {
      return res.redirect('/admin');
    } else {
      return res.render('addPost', {
        title: 'Add Post',
        error: 'Failed to create post'
      });
    }
  } catch (error) {
    console.error('Error processing SIP:', error);
    return res.render('addPost', {
      title: 'Add Post',
      error: 'An error occurred while processing the SIP: ' + error.message
    });
  }
});

router.delete('/delete/post/:id', isAdmin, async function(req, res) {
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
        fs.unlinkSync(path.join(publicDir, file.path));
        fs.rmSync(path.dirname(path.join(publicDir, file.path)),{ recursive: true, force: true })
      }
      
      console.log(`All files for post ${postId} have been deleted`);
    }
    
    return res.status(200).json({ message: 'Files deleted successfully' });
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
