angular.module('gameMemory', [])
  .factory('OpenCommand', ['$timeout', '$rootScope', function ($timeout, $rootScope) {

    var STATE_INIT = 0,
      STATE_FIRST_OPENED = 1,
      STATE_SECOND_OPENED = 2;

    function OpenCommand(game) {
      this.game = game;

      this.first = null;
      this.second = null;

      this.turnsCount = 0;
      this.openedCount = 0;

      this.state = STATE_INIT;

      this.clear = this.clear.bind(this);
    }

    OpenCommand.prototype = {
      execute: function (cell) {
        if (cell.opened) {
          return;
        }
        switch (this.state) {
          case STATE_INIT:
            this.openFirst(cell);
          case STATE_FIRST_OPENED:
            this.openSecond(cell);
        }
      },
      openFirst: function (cell) {
        open(cell);
        this.first = cell;
        this.state = STATE_FIRST_OPENED;
        $rootScope.$broadcast('clickedFirst', { cell: cell });
      },
      openSecond: function (cell) {
        var self = this;

        if (cell === this.first) {
          return;
        }

        $rootScope.$broadcast('clickedSecond', { cell: cell });

        this.second = cell;
        open(cell);

        var lucky = !this.first.beenOpen && !cell.beenOpen;

        markOpen(cell);
        markOpen(this.first);

        if (equal(this.first, cell)) {
          lucky && $rootScope.$broadcast('luckyOpening', { elem: cell.elem });

          this.first = null;
          this.second = null;
          this.openedCount++;
          this.state = STATE_INIT;
          $rootScope.$broadcast('elementOpened', { elem: cell.elem });
          return;
        }

        this.state = STATE_SECOND_OPENED;

        $timeout(this.clear, 1000);
      },
      clear: function () {
        close(this.first);
        close(this.second);
        this.first = null;
        this.second = null;
        this.state = STATE_INIT;
      }
    }

    function equal(one, two) {
      return one && two && one.elem == two.elem;
    }

    function markOpen(cell) {
      if (!cell || cell.beenOpen) {
        return;
      }

      cell.beenOpen = true;
    }

    function open(cell) {
      cell && (cell.opened = true);
      $rootScope.$broadcast('cellOpened', { cell: cell });
    }

    function close(cell) {
      cell && (cell.opened = false);
      $rootScope.$broadcast('cellClosed', { cell: cell });
    }

    return OpenCommand;
  }])
  .value('styles', [])
  .value('modes', [])
  .factory('Game', ['OpenCommand', '$interval', 'styles', 'modes', '$rootScope', function (OpenCommand, $interval, styles, modes, $rootScope) {

    var map = [],
      defaults = {
        width: 6,
        height: 6
      },
      STATE_INIT = 0,
      STATE_STARTED = 1,
      STATE_FINISHED = 2;

    function Game(options) {

      options = angular.extend({}, defaults, options);

      this.width = options.width;
      this.height = options.height;
      this.count = this.width * this.height / 2;
      this.style = styles[options.style];

      this.options = {
        width: this.width,
        height: this.height,
        style: options.style
      };

      this.command = new OpenCommand(this);

      this.state = STATE_INIT;

      this.counters = {
        turns: 0,
        opened: 0
      };

      this.time = 0;
      this.images = [];
      for (var i = 0; i < this.style.count; i++) {
        this.images.push(i);
      }

      map = [];

      if (this.width * this.height % 2 != 0) {
        throw new Error('Impossible to create game with odd area.');
      }

      this.generate = function () {
        var cells = [],
          images = [];

        for (var i = 0; i < this.count; i++) {
          images.push(pullRandom(this.images));
        }
        for (var i = 0; i < this.width; i++) {
          for (var j = 0; j < this.height; j++) {
            cells.push({ x: j, y: i });
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
      }

      this.open = function (cell) {
        if (this.isFinished()) {
          return false;
        }

        this.command.execute(cell);
      }

      this.getRows = function () {
        return map;
      }

      this.startTimer = function () {
        var self = this;
        this.interval = $interval(function () {
          self.time++;
        }, 1000);
      }

      this.stopTimer = function () {
        $interval.cancel(this.interval);
      }

      this.start = function () {
        var self = this;
        this.startTimer();
        this.state = STATE_STARTED;

        $rootScope.$on('clickedSecond', function () {
          self.counters.turns++;
        });
        $rootScope.$on('elementOpened', function () {
          self.counters.opened++;

          if (self.counters.opened == self.count) {
            self.state = STATE_FINISHED;
            self.stopTimer();
            $rootScope.$broadcast('gameFinished', { game: self });
          }
        });
      }

      this.isFinished = function () {
        return this.state == STATE_FINISHED;
      }
    }

    Game.getModes = function (style) {
      var result = [];
      style = styles[style];
      if (!style) {
        return result;
      }

      for (var i = 0, mode; mode = modes[i]; i++) {
        if (mode.minCount <= style.count) {
          result.push(mode);
        }
      }
      return result;
    }

    function addElem(coords, elem) {
      var x = coords.x,
        y = coords.y;

      map[x] || (map[x] = []);
      map[x][y] = {
        id: generateCellId(),
        elem: elem,
        opened: false,
        beenOpen: false
      };
    }

    function generateCellId() {
      return 'cell-' + generateCellId.i++;
    }

    generateCellId.i = 0;

    function pullRandom(array) {
      var index = Math.floor(Math.random() * array.length);
      return array.splice(index, 1)[0];
    }

    return Game;
  }]);