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
        const token = req.cookies.token;
        
        if (!token) {
            return res.render('login', {
                title: 'Login',
                error: 'Authentication failed - missing data'
            });
        }
        
        return res.redirect('/diario');
        
    } catch (error) {
        console.error('Error processing Google callback on frontend:', error);
        return res.render('login', {
            title: 'Login',
            error: 'Authentication failed'
        });
    }
});

router.get('/google/callback', (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.render('login', {
                title: 'Login',
                error: 'Authentication failed - missing data'
            });
        }

        return  res.redirect('/diario');
    } catch (error) {
        console.error('Error processing Google callback on frontend:', error);
        return res.render('login', {
            title: 'Login',
            error: 'Authentication failed'
        });
    }
});

module.exports = router;
