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
        cell.beenOpen = true;
        this.first = cell;
        return false;
      },
      openSecond: function(cell) {
        if(cell === this.first) {
          return false;
        }
        this.second = cell;
        cell.opened = true;
        cell.beenOpen = true;
        if(this.first.elem == cell.elem) {
          this.first = null;
          this.second = null;
          this.openedCount++;
          return true;
        }
        var self = this;
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
  .factory('Game', ['OpenCommand', '$interval', function (OpenCommand, $interval) {

    var map = [],
        defaults = {
          width: 6,
          height: 6
        };

    function Game(options) {

      options = angular.extend({}, defaults, options);

      this.width = options.width;
      this.height = options.height;
      this.count = this.width * this.height / 2;

      this.options = {
        width: this.width,
        height: this.height
      };

      this.command = new OpenCommand(this);
      this.remaining = this.width * this.height;
      this.finished = false;
      this.started = false;

      this.time = 0;
      this.style = 'summer';
      this.images = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

      map = [];

      if (this.width * this.height % 2 != 0) {
        throw new Error('Impossible to create game with odd area.');
      }

      this.generate = function () {
        var cells = [],
            allImages = this.images.slice(),
            images = [];

        for(var i = 0; i < this.count; i++) {
          images.push(pullRandom(allImages));
        }
        for (var i = 0; i < this.width; i++) {
          for (var j = 0; j < this.height; j++) {
            cells.push({ x: i, y: j });
          }
        }

        var stat = {};
        while (cells.length) {
          var elem = pullRandom(images),
              one = pullRandom(cells),
              two = pullRandom(cells);

          stat[elem] || (stat[elem] = 0);
          stat[elem]++;

          addElem(one, elem);
          addElem(two, elem);
        }
        console.log(stat);
      }

      this.open = function (cell) {
        if(!this.started) {
          this.started = true;
        }
        if(this.finished) {
          return false;
        }
        if(this.command.execute(cell)) {
          this.remaining -= 2;
        }
        if(this.remaining == 0) {
          this.finished = true;
          this.stopTimer();
        }
      }

      this.openAll = function() {
        for(var i = 0, row; row = map[i]; i++) {
          for(var j = 0, cell; cell = row[j]; j++) {
            cell.opened = true;
          }
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

      this.startTimer = function() {
        var self = this;
        this.interval = $interval(function() {
          self.time++;
        }, 1000);
      }

      this.stopTimer = function() {
        $interval.cancel(this.interval);
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
        opened: false,
        beenOpen: false
      };
    }

    function shuffle(array) {
      for(var i = 0; i < array.length * 2; i++) {
        array.push(pullRandom(array));
      }
    }

    function pullRandom(array) {
      var index = Math.floor(Math.random() * array.length);
      return array.splice(index, 1)[0];
    }

    return Game;
  }]);