var mongoose = require("mongoose");
var https = require('https');

var UserSchema = new mongoose.Schema({
  username: String,
  twitchId: Number,
  allowEmail: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    default: "user"
  },
  email: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.methods.setRole = function setRole(role){
    this.role = role;
    this.save();
}

UserSchema.methods.setEmail = function setEmail(email){
    this.email = email;
    this.save();
}

UserSchema.methods.isFollowing = function isFollowing(channel, callback){
  https.get("https://api.twitch.tv/kraken/users/" + this.username + "/follows/channels/"+channel, function (res) {
      var body = '';

      res.on('data', function (chunk) {
          body += chunk;
      });

      res.on('end', function () {
          var twitchRes = JSON.parse(body);
          //console.log("Got response: ", twitchRes);

          if (twitchRes.status == "404") {
              callback(null, false);
          } else {
              callback(null, true);
          }
      });
  }).on('error', function (e) {
      console.log("Got error: ", e);
      callback(null, false);
  });
}

UserSchema.methods.isSubscribed = function isSubscribed(channel, token, callback){
  https.get("https://api.twitch.tv/kraken/users/" + this.username + "/subscriptions/" + channel + "?oauth_token="+token, function (res) {
      var body = '';
      
      res.on('data', function (chunk) {
          body += chunk;
      });
      
      res.on('end', function () {
          var twitchRes = JSON.parse(body);
          //console.log("Got response: ", twitchRes);
          
          if (twitchRes.status == "404") {
              callback(null, false);
          } else {
              callback(null, true);
          }
      });
  }).on('error', function (e) {
      console.log("Got error: ", e);
      callback(null, false);
  });
}

var User = mongoose.model('User', UserSchema);

module.exports = User;