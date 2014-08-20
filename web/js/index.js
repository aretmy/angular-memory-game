angular.module('game', ['gameMemory', 'ui.router'])
  .config(['$stateProvider', function($stateProvider) {
    $stateProvider
      .state('index', {
        url: '/',
        views: {
          viewA: { templateUrl: 'templates/hero.html' },
          viewB: { templateUrl: 'templates/causes.html'}
        }
      })
      .state('famehall', {
        url: '/famehall',
        views: {
          viewA: {
            controller: 'FamehallCtrl',
            templateUrl: 'templates/famehall.html'
          }
        }
      })
      .state('game', {
        url: '/game',
        views: {
          viewA: {
            controller: 'HtmlCtrl',
            templateUrl: 'templates/index.html'
          }
        }
      })
      .state('gameStarted', {
        url: '/start',
        views: {
          viewA: {
            controller: 'GameCtrl',
            templateUrl: 'templates/game.html'
          }
        }
      })
      .state('gameFinished', {
        url: '/finished',
        views: {
          viewA: {
            controller: 'FinishCtrl',
            templateUrl: 'templates/finish.html'
          }
        }
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
  .factory('gameManager', ['shared', '$state', '$timeout', 'Game', function(shared, $state, $timeout, Game) {
     return {
       getOptions: function() {
         return shared.get('options', Game.getDefaults());
       },
       createGame: function(options) {
         var game = this.game = new Game(options);
         shared.set('options', options);
         game.generate();
         $state.go('gameStarted');
       },
       getGame: function() {
         if(!this.game) {
           $state.go('game');
           return;
         }
         return this.game;
       },
       openCell: function(cell) {
         if(!this.game) {
           $state.go('game');
           return;
         }
         this.game.open(cell);

         if(this.game.finished) {
           $timeout(function() {
             $state.go('gameFinished');
           }, 2000);
         }
       },
       assertFinished: function() {
         if(!this.game || !this.game.finished) {
           $state.go('game');
         }
       }
     };
  }])
  .controller('MenuCtrl', ['$scope', function($scope) {

  }])
  .controller('FamehallCtrl', ['$scope', function($scope) {

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
