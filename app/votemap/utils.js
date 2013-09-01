
var storedConfig;

exports.env = function () {
    var env = 'dev';
    if (process.env.NODE_ENV) {
        env = process.env.NODE_ENV === 'production' ? 'prod' : process.env.NODE_ENV;
    }
    return env;
};

exports.config = function () {
    if (!storedConfig) {
        var env = exports.env();
        storedConfig = require('../../config/' + env + '.json');
    }
    return storedConfig;
};


// Tile <-> LatLon conversion functions from:
// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29

var PI = Math.PI;

var tileX2Lon = exports.tileX2Lon = function (x, zoom) {
    return (x / Math.pow(2, zoom) * 360 - 180);
};

var tileY2Lat = exports.tileY2Lat = function (y, zoom) {
    var n = PI - 2 * PI * y / Math.pow(2, zoom);
    return (180 / PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
};

var lat2TileY = exports.lat2TileY = function (lat, zoom) {
    var lat_rad = lat * PI / 180;
    return Math.floor(
        (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / PI) / 2 * Math.pow(2, zoom)
    );
};

var lon2TileX = exports.lon2TileX = function (lon, zoom) {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
};

// END code from wiki.openstreetmap.org


var tile2LatLon = exports.tile2LatLon = function (x, y, zoom) {
    if (typeof x === 'object') {
        y = x.y;
        zoom = x.zoom || x.z;
        x = x.x;
    }
    return {
        lat: tileY2Lat(y, zoom),
        lon: tileX2Lon(x, zoom)
    };
};

var latLon2Tile = exports.latLon2Tile = function (lat, lon, zoom) {
    if (typeof lat === 'object') {
        lon = lat.lon;
        zoom = lat.zoom || lat.z;
        lat = lat.lat;
    }
    return {
        x: lon2TileX(lon, zoom),
        y: lat2TileY(lat, zoom)
    };
};
