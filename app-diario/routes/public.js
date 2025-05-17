var express = require('express');
var router = express.Router();
var axios = require('axios')

router.get('/', function(req, res) {
    res.render('home', { title: 'Diário - Home' });
});

router.get('/login', function(req, res) {
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

router.get('/diario', async function(req, res) {
    try{
        const authenticated = req.cookies === null || req.cookies.user === null || req.cookies.token === null
        const response = await axios.get('http://api:3000/api/diary')
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

module.exports = router;
