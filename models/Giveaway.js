var mongoose = require("mongoose");

// the initial seed
Math.seed = 6;

// in order to work 'Math.seed' must NOT be undefined,
// so in any case, you HAVE to provide a Math.seed
Math.seededRandom = function (max, min) {
    max = max || 1;
    min = min || 0;
    
    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    var rnd = Math.seed / 233280;
    
    return min + rnd * (max - min);
}

function generateUUID () { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

var GiveawaySchema = new mongoose.Schema({
  creator: String,
  fromUser: String,
  channel: String,
  item: String,
  winner: {
    type: String
  },
  claimed: {
    type: Boolean,
    default: false
  },
  open: {
    type: Boolean,
    default: false
  },
  uniqueLink: {
    type: String,
    default: ""
  },
  mustFollow: {
    type: Boolean,
    default: false
  },
  mustSub: {
    type: Boolean,
    default: false
  },
  enteredList: {
    type: Array,
    default: []
  },
  mustClaim: {
    type: Boolean,
    default: false
  },
  emailCreator:{
    type: Boolean,
    default: false
  },
  claimTime:{
    type: Number,
    default: 60
  },
  claimTimerStart: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

GiveawaySchema.methods.enterUser = function enterUser(name){
  if(this.open == false){
    return false;
  }

  if(this.enteredList.indexOf(name) >= 0){
    return false
  }else{
    this.enteredList.push(name);
    this.save();
    return true;
  }
}

GiveawaySchema.methods.isUserEntered = function isUserEntered(name){
  if(this.enteredList.indexOf(name) >= 0){
    return true
  }else{
    return false;
  }
}

GiveawaySchema.methods.generateUniqueUrl = function generateUniqueUrl(){
  this.uniqueLink = generateUUID();
  this.save();
}

GiveawaySchema.methods.start = function start(){
  this.open = true;
  this.save();
}

GiveawaySchema.methods.finish = function finish(){
  this.open = false;
  this.save();
}

GiveawaySchema.methods.chooseWinner = function chooseWinner(){
  if(this.enteredList.length == 0){
    //No entered Users
    this.winner = this.creator;
    this.open = false;
    this.save();
    return true;
  }

  var winnerIndex = Math.floor(Math.seededRandom(this.enteredList.length, 0));

  if(this.mustClaim == true){
    this.winner = this.enteredList[winnerIndex];
    this.claimTimerStart = Date.now();
    this.save();
    return true;
  } else {
    this.winner = this.enteredList[winnerIndex];
    this.open = false;
    this.save();
    return true;
  }
}

GiveawaySchema.methods.userClaim = function userClaim(name){
  if(this.mustClaim == true){
    if(this.claimed == false){
      if(this.winner == name){
        this.claimed = true;
        this.open = false;
        this.save();
        return true;
      }
    }
    return false;
  }else{
    return false;
  }
}

GiveawaySchema.methods.failedClaim = function failedClaim(){
  var winnerIndex = this.enteredList.indexOf(this.winner);
  var tempIndex = 0;
  var flag = true;

  if(this.enteredList.length == 1){
    this.claimed = true;
    this.open = false;
    this.save();
    return;
  }

  //Find new user from the entered list that isnt the same as the current
  while(flag){
    tempIndex = Math.floor(Math.seededRandom(this.enteredList.length, 0));
    if(tempIndex != winnerIndex){
      winnerIndex = tempIndex;
      flag = false;
    }
  }
  this.claimTimerStart = Date.now();
  this.winner = this.enteredList[winnerIndex];
  this.save();
  return;
}

var Giveaway = mongoose.model('Giveaway', GiveawaySchema);

module.exports = Giveaway;