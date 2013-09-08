var settings = require('../static/js/settings.js');
var _ = require('underscore');
var gju = require('geojson-utils');
var utils = exports;

var storedConfig;
var PI = Math.PI;

utils.env = function () {
    var env = 'dev';
    if (process.env.NODE_ENV) {
        env = process.env.NODE_ENV === 'production' ? 'prod' : process.env.NODE_ENV;
    }
    return env;
};

utils.config = function () {
    if (!storedConfig) {
        var env = utils.env();
        storedConfig = require('../../config/' + env + '.json');
    }
    return storedConfig;
};

// Formula taken from http://msdn.microsoft.com/en-us/library/aa940990.aspx
var baseMPP = 156543.04;
utils.metresPerPixel = function (lat, zoom) {
    return baseMPP * Math.cos(lat * PI / 180) / Math.pow(2, zoom);
};

utils.clusterClosePoints = function (points, zoom) {
    console.log('clusterClosePoints', points.length);
    if (!points.length) {
        return points;
    }
    var lat = points[0].geometry.coordinates[1];
    var mpp = utils.metresPerPixel(lat, zoom);
    var s = settings;

    var newPoints = [];
    var remainingPoints = _.clone(points);
    var closePoints;
    while (remainingPoints.length) {
        var point = remainingPoints.pop();
        var dotSize = 10; // TODO: Don't hardcode this, use dynamic radius instead
        var mradius = dotSize * mpp;

        // Kind of hacking _.groupBy to act as _.filter and _.reject in one go
        var splitPoints = _.groupBy(remainingPoints, function (p) {
            var pmradius = dotSize * mpp; // TODO: Stop using previous `dotSize`
            // var combinedRadius = mradius + pmradius;
            var combinedRadius = s.combinedSizeMax * 2 * mpp;
            var isClose = gju.geometryWithinRadius(p.geometry, point.geometry, combinedRadius);
            return +isClose;
        });
        remainingPoints = splitPoints[0] || [];
        closePoints = splitPoints[1] || [];

        if (closePoints.length) {
            var combo = {
                id: point.id + '-combination',
                value: {
                    type: 'combination',
                    totalPoints: closePoints.length + 1
                },
                origPoints: [point].concat(closePoints)
            };
            // TODO: Do proper geometry
            combo.geometry = point.geometry;
            newPoints.push(combo);
        } else {
            newPoints.push(point);
        }
    }

    return newPoints;
};



// Tile <-> LatLon conversion functions from:
// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29

utils.tileXToLon = function (x, zoom) {
    return (x / Math.pow(2, zoom) * 360 - 180);
};

utils.tileYToLat = function (y, zoom) {
    var n = PI - 2 * PI * y / Math.pow(2, zoom);
    return (180 / PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
};

utils.latToTileY = function (lat, zoom) {
    var lat_rad = lat * PI / 180;
    return Math.floor(
        (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / PI) / 2 * Math.pow(2, zoom)
    );
};

utils.lonToTileX = function (lon, zoom) {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
};

// END code from wiki.openstreetmap.org


utils.tileToLatLon = function (x, y, zoom) {
    if (typeof x === 'object') {
        y = x.y;
        zoom = x.zoom || x.z;
        x = x.x;
    }
    return {
        lat: utils.tileYToLat(y, zoom),
        lon: utils.tileXToLon(x, zoom)
    };
};

utils.latLonToTile = function (lat, lon, zoom) {
    if (typeof lat === 'object') {
        lon = lat.lon;
        zoom = lat.zoom || lat.z;
        lat = lat.lat;
    }
    return {
        x: utils.lonToTileX(lon, zoom),
        y: utils.latToTileY(lat, zoom)
    };
};
