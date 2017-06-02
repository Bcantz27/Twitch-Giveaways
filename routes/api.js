var express = require('express');
var router = express.Router();

router.use('/user', require('./api/user'));
router.use('/giveaway', require('./api/giveaway'));
router.use('/email', require('./utilities/email'));

module.exports = router;