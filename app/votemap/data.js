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

function cachedQuery(fn) {
    return function (opts) {
        return Q.ninvoke(memClient, 'get', opts.cacheKey).then(function (data) {
            // Return cached data if available
            if (data && data[0]) {
                return JSON.parse(data[0].toString());
            }
            // No cached data, so run the query then cache it
            var promise = fn.call(this, opts);
            promise.then(function (data) {
                memClient.set(opts.cacheKey, JSON.stringify(data));
                return data;
            });
            return promise;
        });
    };
}

/**
 * Get a full list of candidates for all electorates
 * @param  {object} opts
 * @return {Promise} Resolves to array of candidate objects
 */
exports.getCandidates = cachedQuery(function getCandidates(opts) {
    opts = _.extend({}, opts || {});
    var query = {};
    if (opts.divisionId) {
        if (_.isArray(opts.divisionId)) {
            query.keys = opts.divisionId;
        } else {
            query.key = opts.divisionId;
        }
    }
    var view = couch.design('candidates').view('by_division_id');

    return Q.ninvoke(view, 'query', query).then(function (data) {
        data = _.map(data.rows, function (row) {
            return _.omit(row.value, '_id', '_rev', 'datatype');
        });
        return data;
    });
});

/**
 * Get all polling places for a slippy map tile
 * @param  {object} opts
 * @return {Promise} Resolves to GeoJSON FeatureCollection of polling places
 */
exports.getPlacesForTile = cachedQuery(function getPlacesForTile(opts) {
    opts = _.extend({}, opts || {});
    opts.x = +opts.x || 0;
    opts.y = +opts.y || 0;
    opts.zoom = +opts.zoom || 1;
    // This assumes a latitude < 0 (Southern Hemisphere) and longitude > 0 (East of Greenwich Meridian)
    // Since this site is only for Australia anyway, it works fine
    var southWest = utils.tileToLatLon(opts.x, opts.y + 1, opts.zoom);
    var northEast = utils.tileToLatLon(opts.x + 1, opts.y, opts.zoom);
    var bounds = [
        southWest.lon,
        southWest.lat,
        northEast.lon,
        northEast.lat
    ];
    var url = '_design/places/_spatial/for_bounds?bbox=' + bounds.join(',');

    console.log('GET {db}/' + url);
    // Get raw polling place data
    var promise = Q.ninvoke(couch, 'get', url).then(function (data) {
        // Group any nearby points together to avoid sending large amounts of data back to the browser
        var geoPoints = utils.clusterClosePoints(data.rows, opts.zoom);
        // Convert CouchDB results into GeoJSON features
        geoPoints = _.map(geoPoints, function (row) {
            var point = {
                type: 'Feature',
                id: row.id,
                geometry: row.geometry,
                // properties: _.omit(row.value, '_id', '_rev', 'datatype', 'DivisionNm', 'Latitude', 'Longitude')
                properties: _.omit(row.value, '_id', '_rev', 'datatype', 'DivisionNm', 'Latitude', 'Longitude',
                    'PremisesStateAb', 'PremisesAddress1', 'PremisesAddress2', 'PremisesAddress3', 'PremisesPostCode', 'PremisesSuburb', 'PremisesNm')
            };
            if (row.origPoints) {
                point.origPoints = row.origPoints;
            }
            return point;
        });
        // Make the whole list a GeoJSON FeatureCollection
        return {
            type: 'FeatureCollection',
            bbox: bounds,
            features: geoPoints
        };
    });

    // If vote data is requested, make an additional Couch request for votes per polling place
    if (opts.withVotes) {
        promise = promise.then(function (data) {
            // Get a list of unique polling place IDs for the data set (including grouped places)
            var ids = _.flatten(_.map(data.features, function (place) {
                if (place.properties.type === 'combination') {
                    return _.map(place.origPoints, function (point) {
                        return point.value.PollingPlaceID;
                    });
                }
                return place.properties.PollingPlaceID;
            }));

            // Get the votes for all unique places in the list
            return exports.getVotesForPlace({placeId: ids}).then(function (voteData) {
                // Group vote results into an array of results per polling place ID
                var votesByPlace = _.groupBy(voteData, 'PollingPlaceID');
                // Add vote data to the original polling place object
                _.each(data.features, function (place) {
                    place.properties.votes = _.map(votesByPlace[place.properties.PollingPlaceID], function (details) {
                        // If a specific list of vote details is provided, return those values
                        if (_.isArray(opts.voteDetails)) {
                            details = _.pick(details, opts.voteDetails);
                        // Otherwise return all details minus redundant info that's already in the data
                        } else {
                            details = _.omit(details, 'PollingPlaceID', 'PollingPlace');
                        }
                        return details;
                    });
                    // Remove the temporary reference to grouped places, so they're not present in the JSON output
                    delete place.origPoints;
                });
                return data;
            });
        });
    }

    return promise;
});

/**
 * Get all vote data for one or more polling places
 * @param  {object} opts
 * @return {Promise} Resolves to array of vote data per polling place
 */
exports.getVotesForPlace = function getVotesForPlace(opts) {
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
};
