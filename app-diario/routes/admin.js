const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const isAdmin = require('../middleware/auth');
const { validateManifestFiles, processFiles, extractZip, validTags } = require('../utils/utils');

const {
  upload, 
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
  res.render('addPost', { title: "Add Post", tags: validTags});
});

router.put('/edit/post', isAdmin, upload.single('file'), handleMulterError, async function(req, res) {
  try {
      const post = JSON.parse(req.body.post);
      
      if (!post.files) {
          post.files = [];
      }

      if (post.filesToDelete && Array.isArray(post.filesToDelete)) {
          for (const fileToDelete of post.filesToDelete) {
              try {
                  const filePath = path.join(publicDir, fileToDelete);
                  if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                  }
                
                  post.files = post.files.filter(file => file.path !== fileToDelete);
              } catch (error) {
                  console.error(`Error deleting file ${fileToDelete}:`, error);
              }
          }
      }

      let storageDir = req.storageDir;
      if (req.file) {
          const newFile = {
              filename: req.file.originalname,
              path: `/uploads/AIP/${storageDir}/${req.file.originalname}`,
              type: req.file.mimetype,
              size: req.file.size
          };
          post.files.push(newFile);
      }

      const response = await axios.put(`http://api:3000/api/diary/${post._id}`, post, {
          headers: {
              'Authorization': `Bearer ${req.cookies.token}`
          }
      });

      return res.status(200).json(response.data);
  } catch (error) {
      console.error('Error updating post:', error);
      return res.status(500).json({ error: 'Failed to update post' });
  }
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
        error: 'Invalid SIP: Missing manifesto-SIP.json file',
        tags: validTags
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
        error: 'Invalid SIP: The manifest file contains invalid JSON',
        tags: validTags
      });
    }
    
    const filesExist = validateManifestFiles(manifest, extractDir);
    
    if (!filesExist) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      
      return res.render('addPost', {
        title: 'Add Post',
        error: 'Invalid SIP: Manifest file must follow the structure bellow and include both valid tags and files/images',
        tags: validTags
      });
    }
    
    const files = await processFiles(manifest, extractDir);
    
    const formData = {
      producer: user.email,
      title: manifest.title,
      content: manifest.content,
      tags: manifest.tags,
      isPublic: manifest.isPublic === true,
      createdAt: new Date(),
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
        error: 'Failed to create post',
        tags: validTags
      });
    }
  } catch (error) {
    console.error('Error processing SIP:', error);
    return res.render('addPost', {
      title: 'Add Post',
      error: 'An error occurred while processing the SIP: ' + error.message,
      tags: validTags
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
