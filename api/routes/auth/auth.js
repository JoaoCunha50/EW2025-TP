const express = require('express');
const router = express.Router();

const localAuth = require('./local');
const googleAuth = require('./google');
const facebookAuth = require('./facebook');
const adminAuth = require('./admin');

router.use('/admin', adminAuth);
router.use('/', localAuth);
router.use('/google', googleAuth);
router.use('/facebook', facebookAuth);

module.exports = router;