'use strict';

angular.module('myApp').factory('Auth', ['$q', '$http', '$location', '$rootScope',
    function($q, $http, $location, $rootScope) {
        var authService = {};
        $rootScope.authUser = null;

        authService.requestUser = function() {
            var deferred = $q.defer();
            console.log("Requesting User");
            $http.get('/auth/user').then(function(res) {
                if (res.data) {
                    $rootScope.authUser = res.data;
                    $rootScope.authUser.createdAt = new Date(res.data.createdAt).toDateString();
                }

                deferred.resolve(res.data);
            },function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        authService.getUser = function() {
            return $rootScope.authUser;
        }

        authService.isLoggedIn = function() {
            return $rootScope.authUser != null;
        }

        authService.isAdmin = function() {
            return $rootScope.authUser.role == "admin";
        }

        authService.isUser = function() {
            return $rootScope.authUser.role == "user";
        }

        authService.login = function(creds) {
            var deferred = $q.defer();

            $http.post('/auth/login', creds).then(function(res) {
                if (res.data) {
                    $rootScope.authUser = res.data;
                    $location.path('/');
                    deferred.resolve(res.data);
                } else {
                    deferred.reject('Incorrect');
                }
            }, function(error) {
                deferred.reject("Incorrect Username or Password.");
            });

            return deferred.promise;
        }

        authService.loginTwitch = function(creds) {
            var deferred = $q.defer();

            $http.post('/auth/twitch').then(function(res) {
                console.log("Auth");
                if (res.data) {
                    $rootScope.authUser = res.data;
                    $location.path('/');
                    deferred.resolve(res.data);
                } else {
                    deferred.reject('Incorrect');
                }
            }, function(error) {
                deferred.reject("Incorrect Username or Password.");
            });

            return deferred.promise;
        }

        authService.signup = function(creds) {
            var deferred = $q.defer();

            if (creds.password != creds.repassword) {
                deferred.reject("Passwords do not match.");
                return deferred.promise;
            }

            if(creds.username.legnth < 3){
                deferred.reject("Username too short.");
                return deferred.promise;
            }

            if(creds.username.legnth > 8){
                deferred.reject("Username too long.");
                return deferred.promise;
            }

            $http.post('/auth/signup', creds).then(function(res) {
                if (res.data) {
                    $rootScope.authUser = res.data;
                    $location.path('/');
                    deferred.resolve(res.data);
                } else {
                    deferred.reject('Error Occurred');
                }
            }, function(error) {
                deferred.reject("Error Occurred.");
            });

            return deferred.promise;
        }

        authService.logout = function() {
            $rootScope.authUser = null;
            var deferred = $q.defer();

            $http.post('/auth/logout').then(function(res) {
                deferred.resolve(res.data);
            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        return authService;
    }
]);