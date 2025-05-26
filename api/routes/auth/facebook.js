const express = require('express');
const router = express.Router();
const passport = require('../../utils/passport');
const { generateToken } = require('./token');

router.get('/',
    passport.authenticate('facebook', { scope: ['public_profile', 'email']}),
);

router.get('/callback', 
passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        try {
            const user = req.user;
            const token = generateToken(user);
            
            const userData = {
                id: user._id,
                email: user.email,
                role: user.role
            };

            res.cookie('token', token, {
                httpOnly: true,
                secure: false
            });

            res.cookie('email', user.email, {
                httpOnly: true,
                secure: false
            })

            res.redirect(`http://localhost:8080/auth/facebook/callback`);
        } catch (error) {
            console.error('Error in Google callback:', error);
            res.redirect('http://localhost:8080/login?error=Authentication%20failed');
        }
    }
);

module.exports = router;
