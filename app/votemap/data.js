var Couch = require('couch');
var Q = require('q');
var _ = require('underscore');

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
            return _.omit(row.value, '_rev');
        });
    });
}

exports.getCandidates = getCandidates;
