angular.module('game', ['gameMemory', 'ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        controller: 'HtmlCtrl',
        templateUrl: 'templates/index.html'
      })
      .when('/game', {
        controller: 'GameCtrl',
        templateUrl: 'templates/game.html'
      })
      .when('/finish', {
        controller: 'FinishCtrl',
        templateUrl: 'templates/finish.html'
      });
  }])
  .factory('shared', [function() {
    return new function() {

      var data = {};

      this.set = function(name, value) {
        data[name] = value;
        return this;
      }

      this.get = function(name, defaultValue) {
        return angular.isUndefined(data[name]) ? defaultValue : data[name];
      }

    };
  }])
  .factory('gameManager', ['shared', '$location', '$timeout', 'Game', function(shared, $location, $timeout, Game) {
     return {
       getOptions: function() {
         return shared.get('options', Game.getDefaults());
       },
       createGame: function(options) {
         var game = this.game = new Game(options);
         shared.set('options', options);
         game.generate();
         $location.path('/game');
       },
       getGame: function() {
         if(!this.game) {
           $location.path('/');
           return;
         }
         return this.game;
       },
       openCell: function(cell) {
         if(!this.game) {
           $location.path('/');
           return;
         }
         this.game.open(cell);

         if(this.game.finished) {
           $timeout(function() {
             $location.path('/finish');
           }, 2000);
         }
       },
       assertFinished: function() {
         if(!this.game || !this.game.finished) {
           $location.path('/');
         }
       }
     };
  }])
  .controller('HtmlCtrl', ['$scope', 'gameManager', function ($scope, gameManager) {
    $scope.gameOptions = gameManager.getOptions();

    $scope.createGame = function () {
      gameManager.createGame($scope.gameOptions);
    };
  }])
  .controller('GameCtrl', ['$scope', 'gameManager', function($scope, gameManager) {
    $scope.game = gameManager.getGame();

    $scope.open = function(cell) {
      gameManager.openCell(cell);
    }
  }])
  .controller('FinishCtrl', ['$scope', 'gameManager', function($scope, gameManager) {
    gameManager.assertFinished();
    $scope.openedCount = gameManager.getGame().getOpenedCount();
    $scope.turnsCount = gameManager.getGame().getTurnsCount();
  }]);
