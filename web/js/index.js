angular.module('game', ['gameMemory', 'ui.router'])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
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
      .state('famehall.speed', {
        url: '/speed/:page',
        views: {
          viewA: {
            templateUrl: 'templates/famehall.speed.html'
          }
        }
      })
      .state('famehall.strict', {
        url: '/strict/:page',
        views: {
          viewA: {
            templateUrl: 'templates/famehall.strict.html'
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
  .directive('menuItem', ['$state', '$rootScope', function($state, $rootScope) {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        $rootScope.$on('$stateChangeSuccess', function() {
          if($state.includes(attrs.uiSref)) {
            elem.parent().addClass('active');
          } else {
            elem.parent().removeClass('active');
          }
        });
      }
    }
  }])
  .controller('FamehallCtrl', ['$scope', '$state', '$stateParams', function($scope, $state, $stateParams) {
    $scope.users = [];
    console.log($stateParams);
    if($state.is('famehall.speed')) {
      $scope.users = [
        {
          name: 'Artyom',
          time: '1:45'
        }
      ];
    } else if($state.is('famehall.strict')) {
      $scope.users = [
        {
          name: 'Artyom',

        }
      ]
    }
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
