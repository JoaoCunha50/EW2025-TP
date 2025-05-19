var express = require('express');
var router = express.Router();
var axios = require('axios');
var archiver = require('archiver');
var fs = require('fs');
var path = require('path');

router.get('/', function(req, res) {
    res.render('home', { title: 'Diário - Home' });
});

router.get('/login', function(req, res) {
    res.clearCookie('token')
    res.render('login', { title: 'Diário - Login' });
});

router.get('/register', function(req, res) {
    res.render('register', { title: 'Diário - Register' });
});

router.get('/post/:id', async function(req, res) {
    try {
        const response = await axios.get(`http://api:3000/api/diary/${req.params.id}`)
        var post = response.data
        return res.render('post', { title: "Post", post: post})
    } catch (error) {
        console.error("Error: " + error);
        return res.redirect("/diario")
    }
});

router.get('/download/:id', async function(req, res) {
    try {
        // Obter dados do post
        const response = await axios.get(`http://api:3000/api/diary/${req.params.id}`);
        const post = response.data;
        
        const zipFilename = `DIP_${post._id}.zip`;
        const tempDir = path.join(__dirname, '../temp');
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const output = fs.createWriteStream(path.join(tempDir, zipFilename));
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            res.download(path.join(tempDir, zipFilename), zipFilename, () => {
                fs.unlinkSync(path.join(tempDir, zipFilename));
            });
        });
        
        archive.on('error', (err) => {
            res.status(500).send({ error: err.message });
        });
        
        archive.pipe(output);
        
        // Gerar o manifesto
        const manifest = {
            version: '1.0',
            created: new Date().toISOString(),
            post: {
                id: post._id,
                title: post.title,
                content: post.content,
                createdAt: post.createdAt,
                files: post.files ? post.files.map(file => ({
                    filename: file.filename,
                    path: file.path,
                    type: file.type
                })) : []
            }
        };
        
        // Adicionar o manifesto ao ZIP
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifesto-DIP.json' });
        
        const postInfo = `
            Título: ${post.title || 'Sem título'}
            Data: ${new Date(post.createdAt).toLocaleDateString('pt-PT')}
            Conteúdo: ${post.content || 'Sem conteúdo'}
        `;
        
        archive.append(postInfo, { name: 'info.txt' });
        
        if (post.files && post.files.length > 0) {
            // Pasta base para arquivos
            const uploadsDir = path.join(__dirname, '../public');
            
            for (const file of post.files) {
                try {
                    const filePath = path.join(uploadsDir, file.path);
                    
                    if (fs.existsSync(filePath)) {
                        archive.file(filePath, { name: `files/${file.filename}` });
                    } else {
                        console.log('Archive error - file not found')
                    }
                } catch (fileError) {
                    console.error(`Erro ao processar arquivo ${file.filename}:`, fileError);
                }
            }
        }
        
        archive.finalize();
    } catch (error) {
        console.error("Erro ao gerar DIP:", error);
        res.status(500).send('Erro ao gerar pacote de download');
    }
});

router.get('/diario', async function(req, res) {
    try{
        const authenticated = req.cookies.token != null
        const response = await axios.get('http://api:3000/api/diary?isPublic=true')
        var posts = response.data
    
        return res.render('diario', { title: 'Diário digital', authenticated: authenticated, posts: posts });
    } catch (error) {
        console.error("error: " + error)
        return res.render('diario', {title: 'Diario digital'})
    }
});

router.post('/register', async function(req, res) {
    try {
        const response = await axios.post('http://api:3000/api/users', {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            name: req.body.name,
            birthdate: req.body.birthdate,
            role: "user",
            biography: ''
        });
        
        if (response.status === 200) {
            return res.render('login', {
                title: 'Diário',
                message: 'Registration successful!'
            });
        } else {
            return res.render('register', {
                title: 'Register',
                error: 'Registration failed'
            });
        }

    } catch (error) {
        console.error('Registration error:', error.message);
        return res.render('register', {
            title: 'Register',
            error: error.response?.data?.error || 'Registration failed'
        });
    }
});

router.post('/login', async function(req, res) {
    try {
        const response = await axios.post('http://api:3000/api/auth/login', {
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
                return res.render('login', {
                    title: 'Login',
                    error: 'Authentication failed'
                });
            } else {
                return res.redirect('/diario');
            }
        } else {
            return res.render('login', {
                title: 'Login',
                error: 'Authentication failed'
            });
        }
    } catch (error) {
        return res.render('login', {
            title: 'Login',
            error: 'Invalid credentials'
        });
    }
});

router.get('/logout', function(req, res) {
    res.clearCookie('token');
    return res.redirect('/');
});

module.exports = router;