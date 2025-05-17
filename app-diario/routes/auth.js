const router = require('express').Router();
const axios = require('axios');

router.get('/google', async(req, res) => {
    res.redirect('http://localhost:3000/auth/google');
});

router.get('/facebook', async(req, res) => {
    res.redirect('http://localhost:3000/auth/facebook');
});

router.get('/facebook/callback', (req, res) => {
    try {
        const userCookie = req.cookies.user;
        const token = req.cookies.token;
        
        if (!userCookie || !token) {
            return res.render('login', {
                title: 'Login',
                error: 'Authentication failed - missing data'
            });
        }
        
        const user = JSON.parse(userCookie);
        
        if (user.role === 'admin') {
            res.redirect('/admin');
        } else {
            res.redirect('/profile');
        }
    } catch (error) {
        console.error('Error processing Google callback on frontend:', error);
        res.render('login', {
            title: 'Login',
            error: 'Authentication failed'
        });
    }
});

router.get('/google/callback', (req, res) => {
    try {
        const userCookie = req.cookies.user;
        const token = req.cookies.token;

        if (!userCookie || !token) {
            return res.render('login', {
                title: 'Login',
                error: 'Authentication failed - missing data'
            });
        }

        const user = JSON.parse(userCookie);

        if (user.role === 'admin') {
            res.redirect('/admin');
        } else {
            res.redirect('/profile');
        }
    } catch (error) {
        console.error('Error processing Google callback on frontend:', error);
        res.render('login', {
            title: 'Login',
            error: 'Authentication failed'
        });
    }
});

module.exports = router;
