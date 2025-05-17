const isAdmin = (req, res, next) => {
    try {
        if (!req.cookies || !req.cookies.user || !req.cookies.token) {
            return res.redirect('/admin/login');
        }

        const user = JSON.parse(req.cookies.user);
        
        if (user.role !== 'admin') {
            return res.redirect('/');
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.redirect('/admin/login');
    }
};

module.exports = isAdmin;
