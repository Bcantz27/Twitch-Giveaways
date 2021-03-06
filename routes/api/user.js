var express = require('express');
var router = express.Router();
var User = require("../../models/User");
var utils = require("../utilities/utilities.js");

//----------CREATE----------//

//----------/CREATE----------//

//----------READ----------//
router.get('/', utils.ensureAuthenticated, utils.ensureAdmin, function(req, res) {
    User.find({},function(err, users){
        res.json(users);
    });
});

router.get('/stats/total', function(req, res) {
    User.find({},function(err, users){
        res.json(users.length);
    });
});

router.get('/:id', utils.ensureAuthenticated, function(req, res) {
	var id = req.params.id;

	User.findOne({_id: id}, function(err, user){
		res.json(user);
	});
});

router.get('/follows/:channel', utils.ensureAuthenticated, function(req, res) {
    User.findOne({username: req.user.username}, function(err, user){
        user.isFollowing(req.params.channel,function(err,response){
            res.json(response);
        });
    });
});

router.get('/subscribed/:channel', utils.ensureAuthenticated, function(req, res) {
    User.findOne({username: req.user.username}, function(err, user){
        user.isSubscribed(req.params.channel, req.session.accessToken, function(err,response){
            res.json(response);
        });
    });
});
//----------/READ----------//

//----------UPDATE----------//
router.post('/password', utils.ensureAuthenticated, function(req, res) {

    if(req.body.newpassword != req.body.newrepassword){
        res.send("Passwords do not match");
        return;
    }

    req.user.checkPassword(req.body.password, function(err, response){
        if(response){
            req.user.setPassword(req.body.newpassword);
            res.send("true");
        }else{
            res.send("Incorrect password");
        }
    });

});

router.post('/email', utils.ensureAuthenticated, function(req, res) {

    req.user.checkPassword(req.body.emailpassword, function(err, response){
        if(response){
            req.user.setEmail(req.body.email);
            res.send("true");
        }else{
            res.send("Incorrect password");
        }
    });

});

router.post('/settings', utils.ensureAuthenticated, function(req, res) {
    User.update({
        _id: req.user._id 
    }, {
        allowEmail: req.body.allowemail
    }, function(err, numberAffected, doc) {
        res.send("true")
    });
});

router.post('/role/:id', utils.ensureAuthenticated, utils.ensureAdmin, function(req, res) {
    var id = req.params.id;

    User.update({
        _id: id
    }, {
        role: req.body.role
    }, function(err, numberAffected, doc) {
        res.json(doc);
    });

});

router.post('/email/:id', utils.ensureAuthenticated, utils.ensureAdmin, function(req, res) {
    var id = req.params.id;

    User.update({
        _id: id
    }, {
        email: req.body.email
    }, function(err, numberAffected, doc) {
        res.json(doc);
    });

});
//----------/UPDATE----------//

//----------DELETE----------//

//----------/DELETE----------//

module.exports = router;