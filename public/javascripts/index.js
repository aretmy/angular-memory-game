angular.module('game', ['gameMemory', 'ui.router', 'ngAnimate'])
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
        templateUrl: 'templates/famehall.speed.html'
      })
      .state('famehall.strict', {
        url: '/strict/:page',
        templateUrl: 'templates/famehall.strict.html'
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
        url: '/game/start',
        views: {
          viewA: {
            controller: 'GameCtrl',
            templateUrl: 'templates/game.html'
          }
        }
      })
      .state('gameFinished', {
        url: '/game/finished',
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
  .factory('gameManager', ['shared', '$state', '$timeout', 'Game', '$http', 'styles', function(shared, $state, $timeout, Game, $http, styles) {
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
       },
       loadFamehall: function() {
         return $http({method: 'GET', url: 'data/famehall.json'});
       },
       getStyles: function() {
         return styles;
       },
       getModes: function(style) {
         var modes = Game.getModes(style),
            sections = {},
            result = [];

         for(var i = 0, mode; mode = modes[i]; i++) {
           var section = mode.section;

           if(!sections[section]) {
            sections[section] = [];
            result.push(sections[section]);
           }

           sections[section].push(mode);
         }

         return result;
       },
       repeatGame: function() {
         this.createGame(this.game.options);
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
  .filter('modeButtonClass', [function() {
    var cssClasses = {
      easy: 'btn-default',
      middle: 'btn-success',
      hard: 'btn-danger'
    };
    return function(section) {
      return cssClasses[section];
    }
  }])
  .controller('FamehallCtrl', ['$scope', 'gameManager', function($scope, gameManager) {
    $scope.famehall = {};

    gameManager.loadFamehall().success(function(results) {
      $scope.famehall = results;
    });

    $scope.goToGame = function(gameOptions) {
      gameManager.createGame(gameOptions);
    };
  }])
  .controller('HtmlCtrl', ['$scope', 'gameManager', function ($scope, gameManager) {
    $scope.styles = gameManager.getStyles();
    $scope.style = null;
    $scope.modes = [];

    $scope.createGame = function (options) {
      options.style = $scope.style;
      gameManager.createGame(options);
    };

    $scope.chooseStyle = function(style) {
      $scope.style = style;
      $scope.modes = gameManager.getModes($scope.style);
    };
  }])
  .controller('GameCtrl', ['$scope', 'gameManager', '$stateParams', function($scope, gameManager, $stateParams) {
    $scope.game = gameManager.getGame();

    new Image().src = 'images/' + $scope.game.style.name + '/sprite.png';
    $scope.game.startTimer();
    $scope.open = function(cell) {
      gameManager.openCell(cell);
    }
  }])
  .controller('FinishCtrl', ['$scope', 'gameManager', function($scope, gameManager) {
    gameManager.assertFinished();
    $scope.openedCount = gameManager.getGame().getOpenedCount();
    $scope.turnsCount = gameManager.getGame().getTurnsCount();
    $scope.time = gameManager.getGame().time;
    $scope.gameOptions = gameManager.getGame().options;

    $scope.repeatGame = function() {
      gameManager.repeatGame();
    }
  }]);
