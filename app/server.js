/*!
 * Main server
 */

var express = require('express');
var dataStore = require('./votemap/data');

var app = express();

app.set('views', __dirname + '/views');
app.use(express.logger('dev'));
app.use(express.static(__dirname + '/static'));
app.engine('html', require('hjs').__express);
app.set('view engine', 'hjs');

// Home page
app.get('/', function (req, res) {
    res.render('index.html');
});

/*** Data APIs ***/

// List of candidates
app.get('/data/candidates', function (req, res) {
    // TODO: Handle ?query param

    var opts = {};
    if (req.query.divisionId) {
        opts.divisionId = req.query.divisionId;
    }

    dataStore.getCandidates(opts)
        .then(res.json.bind(res))
        .fail(function (reason) {
            console.error('FAIL GET /data/candidates:', reason);
            res.send(500, {reason: reason});
        });
});

// Tile data - places
app.get('/data/places/tile/:zoom/:x/:y', function (req, res) {
    var opts = {
        zoom: req.params.zoom,
        x: req.params.x,
        y: req.params.y,
        withVotes: req.query.votes == 'true'
    };

    dataStore.getPlacesForTile(opts)
        .then(res.json.bind(res))
        .fail(function (reason) {
            console.error('FAIL GET /data/places/tile:', reason);
            res.send(500, {reason: reason});
        });
});


app.listen(parseInt(process.env.PORT || 9876, 10));
