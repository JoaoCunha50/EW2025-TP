const jwt = require('jsonwebtoken');
const config = require('../utils/utils');

const isAdmin = (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token || token === 'undefined' || token === '') {
            return res.redirect('/admin/login');
        }

        if (!config.local || !config.local.secret) {
            throw new Error('JWT secret not configured');
        }

        const decoded = jwt.verify(token, config.local.secret);
        
        if (!decoded || decoded.role !== 'admin') {
            res.clearCookie('token');
            return res.redirect('/');
        }
        req.user = decoded
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.clearCookie('token');
        return res.redirect('/admin/login');
    }
};

module.exports = isAdmin;