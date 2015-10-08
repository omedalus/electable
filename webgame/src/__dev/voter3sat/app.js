var voter3sat = angular.module('Voter3SAT', ['ngRoute']);

voter3sat.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/home', {
        templateUrl: 'voter3sat/views/home.html',
        controller: 'HomeCtrl'
      }).
      when('/board', {
        templateUrl: 'voter3sat/views/board.html',
        controller: 'BoardCtrl'
      }).
      otherwise({
        redirectTo: '/board'
      });
  }]);