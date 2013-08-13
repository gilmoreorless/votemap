var Couch = require('couch');
var Q = require('q');
var _ = require('underscore');
var utils = require('./utils');

var couch = Couch('http://localhost:5984/votemap-dev');

function getCandidates(opts) {
    opts = _.extend({}, opts || {});
    var view = couch.design('candidates').view('by_division_id');
    var query = {};
    if (opts.divisionId) {
        if (_.isArray(opts.divisionId)) {
            query.keys = opts.divisionId;
        } else {
            query.key = opts.divisionId;
        }
    }

    return Q.ninvoke(view, 'query', query).then(function (data) {
        return _.map(data.rows, function (row) {
            return _.omit(row.value, '_id', '_rev', 'datatype');
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
    console.log('GET {db}/' + url);
    return Q.ninvoke(couch, 'get', url).then(function (data) {
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
}

exports.getCandidates = getCandidates;
exports.getPlacesForTile = getPlacesForTile;
