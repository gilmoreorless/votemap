var settings = require('../static/js/settings.js');
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
