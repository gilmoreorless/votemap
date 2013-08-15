/*!
 * Main server
 */

var express = require('express');
var _ = require('underscore');
var dataStore = require('./votemap/data');

var app = express();

app.set('views', __dirname + '/views');
app.use(express.logger('dev'));
app.use(express.static(__dirname + '/static'));
app.engine('html', require('hjs').__express);
app.set('view engine', 'hjs');
// app.set('json spaces', 0);

// Home page
app.get('/', function (req, res) {
    res.render('index.html');
});

/*** Data APIs ***/

// List of candidates
app.get('/data/candidates', function (req, res) {
    var opts = {};
    var divisionId = req.query.divisionId;
    if (divisionId) {
        opts.divisionId = _.isArray(divisionId) ? _.map(divisionId, function (id) {
            return +id || 0;
        }) : +divisionId || 0;
    }

    dataStore.getCandidates(opts)
        .then(function (data) {
            if (req.query.query) {
                var query = req.query.query.toLowerCase();
                data = _.filter(data, function (candidate) {
                    return candidate.GivenNm.toLowerCase().indexOf(query) === 0 ||
                           candidate.Surname.toLowerCase().indexOf(query) === 0;
                });
            }
            res.json(data);
        })
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
        withVotes: false,
        voteDetails: 'all'
    };
    var votesQuery = req.query.votes;
    if (votesQuery == 'true' || votesQuery == 'min' || votesQuery == 'full') {
        opts.withVotes = true;
        if (votesQuery == 'min') {
            opts.voteDetails = ['CandidateID', 'OrdinaryVotesFirstPrefs', 'OrdinaryVotesTCP', 'SwingFirstPrefs', 'SwingTCP'];
        }
    }

    dataStore.getPlacesForTile(opts)
        .then(res.json.bind(res))
        .fail(function (reason) {
            console.error('FAIL GET /data/places/tile:', reason);
            res.send(500, {reason: reason});
        });
});

// Votes for a place
app.get('/data/places/:id/votes', function (req, res) {
    var id = +req.params.id || 0;
    dataStore.getVotesForPlace({placeId: id})
        .then(res.json.bind(res))
        .fail(function (reason) {
            console.error('FAIL GET /data/places/' + id + '/votes:', reason);
            res.send(500, {reason: reason});
        });
});


app.listen(parseInt(process.env.PORT || 9876, 10));
