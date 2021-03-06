'use strict';

var app = angular.module('myApp');  

app.controller('AuthController', ['$scope', '$location', 'Auth', '$routeParams',
    function($scope, $location, Auth, $routeParams) {
        $scope.loginError = $routeParams.error;
        $scope.user = {};
        $scope.dataLoading = false;

        $scope.login = function() {
            $scope.loginError = "";
            $scope.dataLoading = true;
            var promise = Auth.login($scope.user);
            promise.then(function(status) { //Success
                $scope.dataLoading = false;
                $location.path("/");
            }, function(status) { //Failed
                $scope.dataLoading = false;
                $scope.loginError = status;
            });
        }

        $scope.signup = function() {
            $scope.loginError = "";
            $scope.dataLoading = true;
            var promise = Auth.signup($scope.user);
            promise.then(function(status) { //Success
                $scope.dataLoading = false;
                $location.path("/");
            }, function(status) { //Failed
                $scope.dataLoading = false;
                $scope.loginError = status;
            });
        }

        $scope.logout = function() {
            var promise = Auth.logout();
            promise.then(function(status) { //Success
                $location.path($location.path());
            }, function(status) { //Failed

            });
        }

    }
]);

app.controller('PopupController', function($scope, close) {
  
     $scope.close = function(result) {
        close(result, 500); // close, but give 500ms for bootstrap to animate
     };

});

app.controller('AboutController', function($scope, close) {

});

app.controller('SupportController', function($scope, close) {

});

app.controller('NavbarController', ['$scope', '$location', 'Auth',
    function($scope, $location, Auth) {

        $scope.logout = function() {
            var promise = Auth.logout();
            promise.then(function(status) { //Success
                $location.path('/');
            }, function(status) { //Failed

            });
        }

        $scope.isUser = function(){
            return Auth.isUser();
        }

        $scope.isAdmin = function(){
            return Auth.isAdmin();
        }
    }
]);

app.controller('MainController', ['$scope', '$window', '$http', 'Auth',
    function($scope, $window, $http, Auth) {
        $scope.isLoggedIn = function(){
            return Auth.isLoggedIn();
        }

        $scope.loginTwitch = function() {
            var url = "http://" + $window.location.host + "/auth/twitch";
            $window.location.href = url;
        }

        $scope.fetchStats = function(){
            $http.get('/api/user/stats/total').then(function(res) {
                $scope.totalUsers = res.data;
            });
            $http.get('/api/giveaway/stats/total').then(function(res) {
                $scope.totalGiveaways = res.data;
            });
            $http.get('/api/giveaway/stats/active').then(function(res) {
                $scope.totalActiveGiveaways = res.data;
            });
        }

    }
]);

app.controller('CreateController', ['$scope', '$location','$http', 'Auth',
    function($scope, $location, $http, Auth) {
        $scope.fromUser = true;
        $scope.isLoggedIn = function(){
            return Auth.isLoggedIn();
        }

        $scope.createGiveaway = function(){
            $http.post('/api/giveaway/create', $scope.giveaway).then(function(res) {
                $location.path('/g/'+res.data).replace();
                $scope.$apply();
            });
        }
    }
]);

app.controller('ManageController', ['$scope', '$location','$http', 'Auth',
    function($scope, $location, $http, Auth) {
        $scope.currentTab = 0;
        $scope.showEditPanel = false;
        $scope.selectedGiveawayIndex = 0;
        $scope.selectedGiveaway = {};
        $scope.success = "";
        $scope.dataLoading = false;

        $scope.setTab = function(tab){
            fetchGiveaways();
            $scope.currentTab = tab;
        }

        $scope.closeGiveaway = function(index){
            if($scope.currentTab == 0){
                $http.post('/api/giveaway/' + $scope.createdGiveaways[index].uniqueLink + '/open', {open: false}).then(function(res) {
                    $scope.createdGiveaways[index] = res.data;
                    $scope.closeEditPanel();
                });
            }
        }

        $scope.editGiveaway = function(){
            $scope.success = "";
            $scope.dataLoading = true;
            $http.post('/api/giveaway/' + $scope.selectedGiveaway.uniqueLink + '/update', $scope.selectedGiveaway).then(function(res) {
                console.log("Edited");
                console.log(res.data);
                $scope.selectedGiveaway = res.data;
                $scope.createdGiveaways[$scope.selectedGiveawayIndex] = res.data;
                $scope.success = "Settings Updated";
                $scope.dataLoading = false;
            });
        }

        $scope.openEditPanel = function(index){
            if($scope.createdGiveaways[index].open == false){
                //Error Popup
            }else{
                $scope.showEditPanel = true;
                $scope.selectedGiveawayIndex  = index;
                $scope.selectedGiveaway = $scope.createdGiveaways[index];
            }
        }

        $scope.closeEditPanel = function(){
            $scope.showEditPanel = false;
            $scope.selectedGiveawayIndex  = 0;
        }

        $scope.gotoGiveaway = function(index){
            if($scope.currentTab == 0){
                $location.path('/g/' + $scope.createdGiveaways[index].uniqueLink).replace();
                $scope.$apply();
            }else if($scope.currentTab == 1){
                $location.path('/g/' + $scope.enteredGiveaways[index].uniqueLink).replace();
                $scope.$apply();
            }else if($scope.currentTab == 2){
                $location.path('/g/' + $scope.wonGiveaways[index].uniqueLink).replace();
                $scope.$apply();
            }
        }

        var fetchGiveaways = function(){
            $http.get('/api/giveaway/user/created').then(function(res) {
                $scope.createdGiveaways = res.data;
            });

            $http.get('/api/giveaway/user/entered').then(function(res) {
                $scope.enteredGiveaways = res.data;
            });

            $http.get('/api/giveaway/user/won').then(function(res) {
                $scope.wonGiveaways = res.data;
            });
        }
        fetchGiveaways();

    }
]);

app.controller('GiveawayController', ['$scope', '$location','$interval', '$http', 'Auth',
    function($scope, $location, $interval, $http, Auth) {
        var id = $location.path().split("/")[2] || "Unknown";
        var username = Auth.getUser().username;
        var giveawayRefreshPromise;
        $scope.prevWinner = null;
        $scope.rolled = false;
        $scope.timeLeft = 60;

        var initGiveaway = function(){
            console.log(id);
            $http.get('/api/giveaway/' + id).then(function(res) {
                $scope.giveaway = res.data;
                $scope.timeLeft = $scope.giveaway.claimTime;
                $scope.chatSrc = "http://twitch.tv/chat/embed?channel=" + $scope.giveaway.channel + "&popout_chat=true";

                console.log($scope.giveaway.winner);

                if($scope.giveaway == null){
                    setTimeout(function() {
                        $location.path('/').replace();
                        $scope.$apply();
                    }, 5000);
                }

                if($scope.giveaway.winner != null){
                    $scope.rolled = true;

                    $scope.$watch($scope.giveaway.open, function (val) {
                        if(val == false){
                            $interval.cancel(giveawayRefreshPromise);
                        }
                    });
                }

                if($scope.giveaway.mustFollow == true){
                    $http.get('/api/user/follows/' + $scope.giveaway.channel).then(function(res1) {
                        $scope.isFollowing = res1.data;
                    });
                }
                if($scope.giveaway.mustSub == true){
                    $http.get('/api/user/subscribed/' + $scope.giveaway.channel).then(function(res1) {
                        $scope.isSubbed = (res1.data == 'true');
                    });
                }

                $http.get('/api/giveaway/'+ id + '/entered').then(function(res1) {
                    $scope.isEntered = res1.data;
                });

                if($scope.giveaway.open == true)
                    giveawayRefreshPromise = $interval($scope.fetchGiveaway, 1*1000);
            });
        }
        initGiveaway();

        $scope.isLoggedIn = function(){
            return Auth.isLoggedIn();
        }

        $scope.fetchGiveaway = function(){

            $http.get('/api/giveaway/' + id).then(function(res) {
                $scope.giveaway = res.data;

                if($scope.giveaway.winner != null){
                    $scope.rolled = true;
                }

                if($scope.prevWinner == null && giveaway.winner != null){
                    $scope.prevWinner = giveaway.winner;
                    //first winner start timer
                }

                if(giveaway.winner != null && giveaway.winner != $scope.prevWinner){
                    //reset timer and show new winner
                }
            });
        }

        // $scope.fetchEntries = function(){
        //     $http.get('/api/giveaway/' + id + '/entries').success(function(res) {
        //         $scope.giveaway.enteredList = res;
        //     });
        // }

        $scope.$on('$destroy',function(){
            if(giveawayRefreshPromise)
                $interval.cancel(giveawayRefreshPromise);   
        });

        $scope.enterGiveaway = function(){
            if($scope.isEntered == false){
                if($scope.meetsRequirements() == true){
                    $http.post('/api/giveaway/'+ id + '/enter').then(function(res) {
                        if(res.data == true){
                            $scope.isEntered = true;
                        }else{
                            $('#errors').html('Error occured while entering.');
                        }
                    });
                }else{
                    $('#errors').html('You do not meet the requirements.');
                }
            }else{
                $('#errors').html('You are already entered.');
            }
        }

        $scope.startRoll = function(){
            if($scope.giveaway.open == true){
                if(Auth.getUser().username == $scope.giveaway.creator){
                    $http.post('/api/giveaway/'+ id + '/roll').then(function(res) {
                        if(res.data == true){
                            $scope.rolled = true;
                        }else{
                            $('#rollerror').html('Error occured while rolling.');
                        }
                    });
                }else{
                    $('#rollerror').html('You dare not the creator of this giveaway.');
                }
            }else{
                $('#rollerror').html('Giveaway is not open.');
            }
        }

        $scope.claim = function(){
            if($scope.giveaway.open == true && Auth.getUser().username == $scope.giveaway.winner){
                $http.post('/api/giveaway/'+ id + '/claim').then(function(res) {
                    if(res.data == true){
                        $scope.giveaway.claimed = true;
                    }else{
                        $('#claimerror').html('Error occured while claiming.');
                    }
                });
            }else{
                $('#claimerror').html('You are not the winner.');
            }
        }

        $scope.meetsRequirements = function(){
            var flag = true;
            if($scope.giveaway.mustSub == true){
                if($scope.isSubbed == false){
                    flag = false;
                }
            }

            if($scope.giveaway.mustFollow == true){
                if($scope.isFollowing == false){
                    flag = false;
                }
            }
            return flag;
        }

        var claimTimeLeft = function(){
            var claimTime = $scope.giveaway.claimTime;;
            var secondsElapsed = 0;
            var timeLeft = $scope.giveaway.claimTime;
            var startDate;
            var endDate = new Date();

            if($scope.giveaway.claimTimerStart != null){
                startDate = new Date($scope.giveaway.claimTimerStart);
                secondsElapsed = (endDate.getTime() - startDate.getTime()) / 1000;
            }

            timeLeft = claimTime - secondsElapsed;

            if(timeLeft < 0){
                timeLeft = 0;
            }

            return timeLeft;
        }

        $scope.$watch(function () {
          return claimTimeLeft();
        }, function (val) {
           $scope.timeLeft = Math.floor(val);
        });
    }
]);

app.controller('VerificationController', ['$scope', 'Auth', '$http','$routeParams',
    function($scope, Auth, $http, $routeParams) {
        $scope.token = $routeParams.token;
        $scope.success = "";
        $scope.error = "";

        $scope.verifyEmail = function(){
            $scope.success = "";
            $scope.error = "";
            $http.post('/api/email/verify', {token: $scope.token}).success(function(res) {
                if(res == "true"){
                    $scope.success = "Email verified";
                    Auth.requestUser();
                }else{
                    $scope.error = res;
                }
            });
        }
        
    }
]);

app.controller('AccountController', ['$scope', 'Auth', '$http',
    function($scope, Auth, $http) {
        $scope.currentTab = 0;
        $scope.error = "";
        $scope.success = "";
        $scope.dataLoading = false;
        $scope.user = {};
        $scope.setTab = function(tab){
            $scope.currentTab = tab;
        }

        $scope.updatePassword = function(){
            $scope.error = "";
            $scope.success = "";
            
            if($scope.user.newpassword != $scope.user.newrepassword){
                $scope.error = "Passwords do not match";
                return
            }

            $scope.dataLoading = true;
            $http.post('/api/user/password', $scope.user).then(function(res) {
                $scope.dataLoading = false;
                if(res.data == 'true'){
                    Auth.requestUser();
                    $scope.success = "Password Updated";
                }else{
                    $scope.error = res.data;
                }
                $scope.user = {};
            });
        }

        $scope.updateEmail = function(){
            $scope.error = "";
            $scope.success = "";
            $scope.dataLoading = true;

            $http.post('/api/user/email', $scope.user).then(function(res) {
                $scope.dataLoading = false;
                if(res.data == 'true'){
                    Auth.requestUser();
                    $scope.success = "Email Updated";
                }else{
                    $scope.error = res.data;
                }
                $scope.user = {};
            });
        }

        $scope.updateSettings = function(){
            
            if($scope.user.allowemail == null){
                $scope.user.allowemail = false;
            }

            $scope.error = "";
            $scope.success = "";
            $scope.dataLoading = true;

            $http.post('/api/user/settings', $scope.user).then(function(res) {
                $scope.dataLoading = false;
                if(res.data == 'true'){
                    Auth.requestUser();
                    $scope.success = "Settings Updated";
                }else{
                    $scope.error = res.data;
                }
                $scope.user = {};
            });

        }

        $scope.resendVerify = function(){
            $scope.success = "";
            $http.post('/api/email/reverify').then(function(res) {
                if(res.data == 'true'){
                    Auth.requestUser();
                    $scope.success = "Email Sent";
                }else{
                    $scope.error = res.data;
                }
            });
        }
    }
]);

app.controller('AdminController', ['$scope', 'Auth', '$http',
    function($scope, Auth, $http) {
        $scope.currentTab = 0;
        $scope.users = {};
        $scope.selectedUserIndex = 0;
        $scope.selectedUser = {};
        $scope.selectedGiveawayIndex = 0;
        $scope.selectedGiveaway = {};
        $scope.userEmail = {};
        $scope.massEmail = {};
        $scope.success = "";
        $scope.dataLoading = false;

        $scope.setTab = function(tab){
            $scope.success = "";
            $scope.dataLoading = false;
            refreshUsers();
            refreshGiveaways();
            $scope.currentTab = tab;
        }

        $scope.setSelectedUser = function(index){
            $scope.success = "";
            $scope.dataLoading = false;
            $scope.userEmail = {};
            $scope.selectedUserIndex = index;
            $scope.selectedUser = $scope.users[index];
        }

        $scope.setSelectedGiveaway = function(index){
            $scope.success = "";
            $scope.dataLoading = false;
            $scope.selectedGiveawayIndex = index;
            $scope.selectedGiveaway = $scope.giveaways[index];
        }

        $scope.editUser = function(){
            $scope.success = "";
            $scope.dataLoading = true;
            $http.post('/api/user/role/' + $scope.selectedUser._id, $scope.selectedUser).then(function(res) {
                $http.post('/api/user/email/' + $scope.selectedUser._id, $scope.selectedUser).then(function(res1) {
                    $scope.dataLoading = false;
                    $scope.success = "User Updated";
                    $scope.users[$scope.selectedUser] = res1.data;

                });
            });
        }

        $scope.sendMail = function(){
            $scope.success = "";
            $scope.dataLoading = true;
            $http.post('/api/email/user/' + $scope.selectedUser._id, {subject: $scope.userEmail.subject, message: $scope.userEmail.message}).then(function(res) {
                $scope.success = "Message Sent";
                $scope.userEmail = {};
                $scope.dataLoading = false;
            });
        }

        $scope.massMail = function(){
            $scope.success = "";
            $scope.dataLoading = true;
            $http.post('/api/email/all', {subject: $scope.massEmail.subject, message: $scope.massEmail.message}).then(function(res) {
                $scope.success = "Message Sent";
                $scope.massEmail = {};
                $scope.dataLoading = false;
            });
        }

        var refreshUsers = function() {
            $scope.success = "";
            $scope.selectedUserIndex = 0;
            $scope.selectedUser = {};
            $http.get('/api/user').then(function(res) {
                $scope.users = res.data;
                $scope.selectedUser = $scope.users[$scope.selectedUserIndex];
            });
        }

        var refreshGiveaways = function() {
            $scope.success = "";
            $scope.selectedGiveawayIndex = 0;
            $scope.selectedGiveaway = {};
            $http.get('/api/giveaway').then(function(res) {
                $scope.giveaways = res.data;
                $scope.selectedGiveaway = $scope.giveaways[$scope.selectedGiveawayIndex];
            });
        }
    }
]);