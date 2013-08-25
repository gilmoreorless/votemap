/*!
 * Main server
 */

var express = require('express');
var _ = require('underscore');
var dataStore = require('./votemap/data');
var loggerUtil = require('./votemap/logger');

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
    var opts = {
        cacheKey: req.url
    };
    var divisionId = req.query.divisionId;
    if (divisionId) {
        opts.divisionId = _.isArray(divisionId) ? _.map(divisionId, function (id) {
            return +id || 0;
        }) : +divisionId || 0;
    }
    var logger = loggerUtil.create(req.url);

    dataStore.getCandidates(opts)
        .then(logger.timerPromise(req.query))
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
            logger.error(req, opts, reason);
            res.send(500, {reason: reason});
        });
});

// Tile data - places
app.get('/data/places/tile/:zoom/:x/:y', function (req, res) {
    var opts = {
        cacheKey: req.url,
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
    var logger = loggerUtil.create(req.url);

    dataStore.getPlacesForTile(opts)
        .then(logger.timerPromise())
        .then(res.json.bind(res))
        .fail(function (reason) {
            logger.error(req, opts, reason);
            res.send(500, {reason: reason});
        });
});

// Votes for a place
app.get('/data/places/:id/votes', function (req, res) {
    var id = +req.params.id || 0;
    var logger = loggerUtil.create('/data/places/' + id + '/votes');
    dataStore.getVotesForPlace({placeId: id})
        .then(logger.timerPromise())
        .then(res.json.bind(res))
        .fail(function (reason) {
            logger.error(req, {}, reason);
            res.send(500, {reason: reason});
        });
});


app.listen(parseInt(process.env.PORT || 9876, 10));
