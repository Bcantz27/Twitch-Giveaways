var express = require('express');
var router = express.Router();
var Giveaway = require("../../models/Giveaway");
var utils = require("../utilities/utilities.js");

var giveawayTimers = {};

//----------CREATE----------//
router.post('/create', utils.ensureAuthenticated, function(req, res) {
    var fromUser = req.body.fromUser;

    if(fromUser == null){
    	fromUser = req.user.username;
    }

    Giveaway.create({
        creator: req.user.username,
        fromUser: fromUser,
        channel: req.body.channel,
        item: req.body.item,
        mustFollow: req.body.reqFollow,
		mustSub: req.body.reqSub,
		mustClaim: req.body.reqClaim,
		emailCreator: req.body.emailCreator,
		claimTime: req.body.claimTime
    }, function(err, newGiveaway) {
        newGiveaway.generateUniqueUrl();
        newGiveaway.start();
        res.send(newGiveaway.uniqueLink);
    });
});
//----------/CREATE----------//

//----------READ----------//
router.get('/', utils.ensureAuthenticated, utils.ensureAdmin, function(req, res) {
    Giveaway.find({},function(err, giveaways){
        res.json(giveaways);
    });
});

router.get('/stats/total', function(req, res) {
    Giveaway.find({},function(err, giveaways){
        res.json(giveaways.length);
    });
});

router.get('/stats/active', function(req, res) {
    Giveaway.find({open: true},function(err, giveaways){
        res.json(giveaways.length);
    });
});

router.get('/:id', utils.ensureAuthenticated, function(req, res) {
	var id = req.params.id;

	Giveaway.findOne({uniqueLink: id}, function(err, giveaway){
		res.json(giveaway);
	});
});

router.get('/user/created', utils.ensureAuthenticated, function(req, res) {
    Giveaway.findOne({creator: req.user.username}, function(err, giveaways){
        res.json(giveaways);
    });
});

router.get('/user/entered', utils.ensureAuthenticated, function(req, res) {
    Giveaway.findOne({enteredList: { "$in" : [req.user.username]}}, function(err, giveaways){
        res.json(giveaways);
    });
});

router.get('/:id/entered', utils.ensureAuthenticated, function(req, res) {
    var id = req.params.id;

    Giveaway.findOne({uniqueLink: id}, function(err, giveaway){
        res.send(giveaway.isUserEntered(req.user.username));
    });
});

router.get('/:id/entries', utils.ensureAuthenticated, function(req, res) {
    var id = req.params.id;

    Giveaway.findOne({uniqueLink: id}, function(err, giveaway){
        res.send(giveaway.enteredList);
    });
});

router.post('/:id/enter', utils.ensureAuthenticated, function(req, res) {
    var id = req.params.id;

    Giveaway.findOne({uniqueLink: id}, function(err, giveaway){
        res.send(giveaway.enterUser(req.user.username));
    });
});

router.post('/:id/roll', utils.ensureAuthenticated, function(req, res) {
    var id = req.params.id;

    Giveaway.findOne({uniqueLink: id}, function(err, giveaway){
        if(giveaway.chooseWinner()){

            giveawayTimers[id] = setInterval(function () {
                    if (giveaway.claimed == false) {
                        giveaway.failedClaim();
                    } else {
                        giveaway.finish();

                        utils.sendEmailtoUser(giveaway.creator, 
                            'TwitchGiveaways: Giveaway for ' + giveaway.item + " has a Winner!", 
                            '<b>The giveaway has ended and a winner was selected!</b><p>The winner of the ' + giveaway.item + ' was <a href="http://www.twitch.tv/' + req.user.username + '/profile">' + req.user.username + '</a></p><p>Link to the Giveaway Page: <a href="http://www.twitch-giveaways.com/g/' + giveaway.uniLink + '">http://www.twitch-giveaways.com/g/' + giveaway.uniLink + '</a></p><p>Please take the necessary action to get in contact with the winner and supply the item they have won.</p>');

                        clearInterval(giveawayTimers[id]);
                    }
            }, giveaway.claimTime*1000);
            res.send(true);
        }else{
            res.send(false);
        }
    });
});

router.post('/:id/claim', utils.ensureAuthenticated, function(req, res) {
    var id = req.params.id;

    Giveaway.findOne({uniqueLink: id}, function(err, giveaway){
        if(giveaway.userClaim(req.user.username)){
            clearInterval(giveawayTimers[id]);
            res.send(true);
        }else{
            res.send(false);
        }
    });
});
//----------/READ----------//

//----------UPDATE----------//

//----------/UPDATE----------//

//----------DELETE----------//

//----------/DELETE----------//

module.exports = router;