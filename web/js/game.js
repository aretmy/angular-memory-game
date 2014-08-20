angular.module('gameMemory', [])
  .factory('OpenCommand', ['$timeout', function($timeout) {
    function OpenCommand(game) {
      this.game = game;
      this.first = null;
      this.second = null;
      this.turnsCount = 0;
      this.openedCount = 0;
    }

    OpenCommand.prototype = {
      execute: function(cell) {
        if(this.first && !this.second) {
          this.turnsCount++;
          return this.openSecond(cell);
        } else if(!this.second) {
          return this.openFirst(cell);
        }
        return false;
      },
      openFirst: function(cell) {
        var self = this;
        cell.opened = true;
        this.first = cell;
        this.timeout = $timeout(function() {
          self.first.opened = false;
          self.first = null;
          self.timeout = null;
        }, 2000);
        return false;
      },
      openSecond: function(cell) {
        if(cell === this.first) {
          return false;
        }
        this.second = cell;
        cell.opened = true;
        if(this.first.elem == cell.elem) {
          this.timeout && $timeout.cancel(this.timeout);
          this.timeout = null;
          this.first = null;
          this.second = null;
          this.openedCount++;
          return true;
        }
        var self = this;
        this.timeout && $timeout.cancel(this.timeout);
        $timeout(function() {
          self.first.opened = false;
          self.second.opened = false;
          self.first = null;
          self.second = null;
          self.timeout = null;
        }, 1000);
        return false;
      }
    }

    return OpenCommand;
  }])
  .factory('Game', ['OpenCommand', function (OpenCommand) {

    var map = [],
        defaults = {
          width: 6,
          height: 6,
          count: 5
        };

    function Game(options) {

      options = angular.extend({}, defaults, options);

      this.width = options.width;
      this.height = options.height;
      this.count = options.count;

      this.command = new OpenCommand(this);
      this.remaining = this.width * this.height;
      this.finished = false;


      if (this.width * this.height % 2 != 0) {
        throw new Error('Impossible to create game with odd area.');
      }

      this.generate = function () {
        var cells = [];
        for (var i = 0; i < this.width; i++) {
          for (var j = 0; j < this.height; j++) {
            cells.push({ x: i, y: j });
          }
        }

        while (cells.length) {
          var elem = Math.floor(Math.random() * this.count),
            one = pullRandom(cells),
            two = pullRandom(cells);

          addElem(one, elem);
          addElem(two, elem);
        }
      }

      this.open = function (cell) {
        if(this.finished) {
          return false;
        }
        if(this.command.execute(cell)) {
          this.remaining -= 2;
        }
        if(this.remaining == 0) {
          this.finished = true;
        }
      }

      this.getRows = function () {
        return map;
      }

      this.getTurnsCount = function() {
        return this.command.turnsCount;
      }

      this.getOpenedCount = function() {
        return this.command.openedCount;
      }

    }

    Game.getDefaults = function() {
      return angular.copy(defaults);
    }

    function addElem(coords, elem) {
      var x = coords.x,
        y = coords.y;

      map[x] || (map[x] = []);
      map[x][y] = {
        elem: elem,
        opened: false
      };
    }

    function pullRandom(array) {
      var index = Math.floor(Math.random() * array.length);
      return array.splice(index, 1)[0];
    }

    return Game;
  }]);