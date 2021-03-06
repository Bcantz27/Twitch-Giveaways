'use strict';

angular.module('myApp', ['ngRoute', 'ui.bootstrap', 'oc.lazyLoad'])
    .config(function($routeProvider, $locationProvider, $ocLazyLoadProvider) {
        $ocLazyLoadProvider.config({
            debug: false,
            events: true,
        });
        $routeProvider
            .when('/', {
                templateUrl: 'templates/main',
                controller: 'MainController'
            })
            .when('/about', {
                templateUrl: 'templates/about',
                controller: 'AboutController'
            })
            .when('/support', {
                templateUrl: 'templates/support',
                controller: 'SupportController'
            })
            .when('/create', {
                templateUrl: 'templates/create',
                controller: 'CreateController',
                resolve: {
                    factory: checkRouting("user")
                }
            })
            .when('/g/:id', {
                templateUrl: 'templates/giveaway',
                controller: 'GiveawayController',
                resolve: {
                    factory: checkRouting("user")
                }
            })
            .when('/manage', {
                templateUrl: 'templates/manage',
                controller: 'ManageController',
                resolve: {
                    factory: checkRouting("user")
                }
            })
            .when('/verify', {
                templateUrl: 'views/verify.html',
                controller: 'VerificationController',
                resolve: {
                    factory: checkRouting("user")
                }
            })
            .when('/account', {
                templateUrl: 'views/account/index.html',
                controller: 'AccountController',
                resolve: {
                    factory: checkRouting("user")
                }
            })            
            .when('/admin', {
                templateUrl: 'templates/admin/index',
                controller: 'AdminController',
                resolve: {
                    factory: checkRouting("admin"),
                    loadMyFiles: function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'myApp',
                            files: [
                                'js/directives/chat/chat.js',
                                'js/directives/dashboard/stats/stats.js'
                            ]
                        })
                    }
                }
            })
            .otherwise({
                redirectTo: '/'
            });
        $locationProvider.html5Mode(true).hashPrefix('*');
    })
    .run(function(Auth, $rootScope, $location) {


        $rootScope.$watch('authUser', function(authUser) {
            if (!authUser) {
                Auth.requestUser();
            }
        });
    });

var checkRouting = function(reqRole) {
    return function($q, $rootScope, $location, $http) {
        if ($rootScope.authUser) {
            if ($rootScope.authUser.role == "admin" || $rootScope.authUser.role == reqRole) {
                return true;
            } else {
                $location.path("/login").search({
                    error: 'Insufficient permissions'
                });
                return false;
            }

        } else {
            var deferred = $q.defer();
            $http.get("/auth/user")
                .then(function(res) {
                    if (res.data) {
                        $rootScope.authUser = res.data;
                        $rootScope.authUser.createdAt = new Date($rootScope.authUser.createdAt).toDateString();
                        if ($rootScope.authUser.role == "admin" || $rootScope.authUser.role == reqRole) {
                            deferred.resolve(true);
                        } else {
                            deferred.reject();
                            $location.path("/login").search({
                                error: 'Insufficient permissions'
                            });
                        }
                    } else {
                        deferred.reject();
                        $location.path("/login").search({
                            error: 'You must login to view that page.'
                        });
                    }
                }, function(error) {
                    deferred.reject();
                    $location.path("/login").search({
                        error: 'You must login to view that page.'
                    });;
                });
            return deferred.promise;
        }
    };
};