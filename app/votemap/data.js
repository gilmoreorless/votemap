var Couch = require('couch');
var Q = require('q');
var memjs = require('memjs');
var _ = require('underscore');
var utils = require('./utils');

var config = utils.config();
console.log('Starting with config (%s):', utils.env(), config);

var couch = Couch(config.couch_url + config.couch_db);
var memClient = memjs.Client.create();

// memClient.flush();

function getCandidates(opts) {
    opts = _.extend({}, opts || {});
    var query = {};
    if (opts.divisionId) {
        if (_.isArray(opts.divisionId)) {
            query.keys = opts.divisionId;
        } else {
            query.key = opts.divisionId;
        }
    }

    return Q.ninvoke(memClient, 'get', opts.cacheKey).then(function (data) {
        if (data && data[0]) {
            return JSON.parse(data[0].toString());
        }

        var view = couch.design('candidates').view('by_division_id');
        return Q.ninvoke(view, 'query', query).then(function (data) {
            data = _.map(data.rows, function (row) {
                return _.omit(row.value, '_id', '_rev', 'datatype');
            });
            memClient.set(opts.cacheKey, JSON.stringify(data));
            return data;
        });
    });
}

function getPlacesForTile(opts) {
    opts = _.extend({}, opts || {});
    opts.x = +opts.x || 0;
    opts.y = +opts.y || 0;
    opts.zoom = +opts.zoom || 1;
    // This assumes a latitude < 0 (Southern Hemisphere) and longitude > 0 (East of Greenwich Meridian)
    // Since this site is only for Australia anyway, it works fine
    var southWest = utils.tile2LatLon(opts.x, opts.y + 1, opts.zoom);
    var northEast = utils.tile2LatLon(opts.x + 1, opts.y, opts.zoom);
    var bounds = [
        southWest.lon,
        southWest.lat,
        northEast.lon,
        northEast.lat
    ];
    var url = '_design/places/_spatial/for_bounds?bbox=' + bounds.join(',');

    return Q.ninvoke(memClient, 'get', opts.cacheKey).then(function (data) {
        if (data && data[0]) {
            return JSON.parse(data[0].toString());
        }

        console.log('GET {db}/' + url);
        var promise = Q.ninvoke(couch, 'get', url).then(function (data) {
            var geoPoints = _.map(data.rows, function (row) {
                return {
                    type: 'Feature',
                    id: row.id,
                    geometry: row.geometry,
                    properties: _.omit(row.value, '_id', '_rev', 'datatype', 'DivisionNm', 'Latitude', 'Longitude')
                };
            });
            return {
                type: 'FeatureCollection',
                bbox: bounds,
                features: geoPoints
            };
        });
        if (opts.withVotes) {
            promise = promise.then(function (data) {
                var ids = _.map(data.features, function (place) {
                    return place.properties.PollingPlaceID;
                });
                return getVotesForPlace({placeId: ids}).then(function (voteData) {
                    var votesByPlace = _.groupBy(voteData, 'PollingPlaceID');
                    _.each(data.features, function (place) {
                        place.properties.votes = _.map(votesByPlace[place.properties.PollingPlaceID], function (details) {
                            if (_.isArray(opts.voteDetails)) {
                                details = _.pick(details, opts.voteDetails);
                            } else {
                                details = _.omit(details, 'PollingPlaceID', 'PollingPlace');
                            }
                            return details;
                        });
                    });
                    return data;
                });
            });
        }
        promise = promise.then(function (data) {
            memClient.set(opts.cacheKey, JSON.stringify(data));
            return data;
        });

        return promise;
    });
}

function getVotesForPlace(opts) {
    opts = _.extend({}, opts || {});
    var view = couch.design('places').view('votes');
    var query = {};
    if (opts.placeId) {
        if (_.isArray(opts.placeId)) {
            query.keys = opts.placeId;
        } else {
            query.key = opts.placeId;
        }
    }

    return Q.ninvoke(view, 'query', query).then(function (data) {
        return _.map(data.rows, function (row) {
            return row.value;
        });
    });
}

exports.getCandidates = getCandidates;
exports.getPlacesForTile = getPlacesForTile;
exports.getVotesForPlace = getVotesForPlace;
