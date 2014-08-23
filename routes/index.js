var express = require('express');
var router = express.Router();
var FS = require('q-io/fs');
var Q = require('q');

/* GET home page. */
router.get('/', function(req, res) {
  Q.all([
      FS.read(__dirname + '/../data/styles.json').then(JSON.parse),
      FS.read(__dirname + '/../data/modes.json').then(JSON.parse)
  ]).then(function(results) {
    res.render('index', {
      styles: results[0],
      modes: results[1]
    });
  });
});

router.get('/github', function(req, res) {
  res.status('302');
  res.set({
    'Location': 'https://github.com/aretmy/angular-memory-game'
  });
  res.end();
});

module.exports = router;
