var VM = (function () {
    var VM = {
        map: null,
        data: {},
        utils: {},
        settings: {},
        templates: {}
    };

    VM.settings = {
        voteMax: 3500,
        sizeMin: 4,
        sizeMax: 10,
        colours: {
            TIED: '#ff00ff',
            ALP: '#ff0000',  // Australian Labor Party
            LP:  '#0000ff',  // Liberal Party (coalition)
            NP:  '#999900',  // National Party
            GRN: '#00ff00',  // The Greens
            IND: '#000000'   // Independent
        }
    };


    /*** Leaflet hacks ***/

    // Make circle markers have the same popup methods as normal markers
    // After all, they're both bloody markers, why do they have different popups?
    var markerPopupMethods = ['togglePopup', 'setPopupContent'];
    _.each(markerPopupMethods, function (method) {
        L.CircleMarker.prototype[method] = L.Marker.prototype[method];
    });


    /*** Data storage ***/

    superagent.get('/data/candidates').end(function (res) {
        VM.data.candidates = res.body;
        VM.data.candidates.byId = {};
        _.each(res.body, function (candidate) {
            VM.data.candidates.byId[candidate.CandidateID] = candidate;
        });
        initPlaceLayer();
    });

    // Only used if the party abbreviation isn't in VM.settings.colours
    VM.data.partyColourAlias = {
        CLP: 'LP',   // Country Liberals (NT)
        CLR: 'ALP',  // Country Labor
        LNQ: 'LP'    // Liberal National Party of Queensland
    };


    /*** Templates / Utils ***/

    VM.templates.placePopup = _.template(document.getElementById('tpl-place-popup').innerHTML);

    VM.utils.sum = function (numbers) {
        return _.reduce(numbers, function (memo, value) {
            return memo + (+value || 0);
        }, 0);
    };

    VM.utils.getStyleForFeature = function (feature) {
        var v = feature.properties.votes;
        var s = VM.settings;
        var totalVotes = VM.utils.sum(_.pluck(v, 'OrdinaryVotesFirstPrefs'));
        var size = (totalVotes / s.voteMax) * (s.sizeMax - s.sizeMin) + s.sizeMin;
        // Assuming TCP for now
        var winningCandidateData = _.reduce(v, function (prevMax, voteData) {
            // TODO: Handle ties
            if (voteData.OrdinaryVotesTCP) {
                if (!prevMax.OrdinaryVotesTCP || voteData.OrdinaryVotesTCP > prevMax.OrdinaryVotesTCP) {
                    return voteData;
                }
            }
            return prevMax;
        }, {});
        var winningCandidate = VM.data.candidates.byId[winningCandidateData.CandidateID];
        if (!winningCandidate) {
            return {
                fillOpacity: 0,
                radius: 0
            };
        }
        var party = winningCandidate.PartyAb;
        var colour = VM.settings.colours[party];
        if (!colour && (party in VM.data.partyColourAlias)) {
            colour = VM.settings.colours[VM.data.partyColourAlias[party]];
        }
        if (!colour) {
            colour = '#999';
        }
        // var party = p.alpVotes == p.libVotes ? 'tie' : p.alpVotes > p.libVotes ? 'alp' : 'lib';
        // var strength = party == 'tie' ? 0.5 : p[party + 'Perc'] / 100;
        // if (!feature.element) continue;
        // feature.element.setAttribute("class", "booth");
        // feature.element.setAttribute("r", size);
        // feature.element.setAttribute("fill", s.colours[party]);
        // feature.element.setAttribute("fill-opacity", strength);

        return {
            fillColor: colour,
            stroke: false,
            fillOpacity: 0.5,
            radius: size
        };
    };

    VM.utils.renderFullDetailsForPlace = function (placeData) {
        return VM.templates.placePopup(placeData);
        return '<h3>' + placeData.PollingPlaceNm + '</h3>';
    };


    /*** Leaflet init ***/

    var map = VM.map = L.map('map', {
        center: [-33.7609, 150.932],
        zoom: 14,
        minZoom: 4,
        maxZoom: 18
        // maxBounds: [[1, 2], [3, 4]]
    });

    L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
        key: '9d5d057459c24f2e8359c28738e1ab3b',
        styleId: 998,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }).addTo(map);

    function initPlaceLayer() {
        var placesLayer = new L.TileLayer.GeoJSON('/data/places/tile/{z}/{x}/{y}?votes=min', {
            clipTiles: false,
            unique: function (feature) {
                return feature.id;
            }
        }, {
            style: VM.utils.getStyleForFeature,
            pointToLayer: function (feature, latlon) {
                return L.circleMarker(latlon);
                return L.marker(latlon);
            },
            onEachFeature: function (feature, layer) {
                // Lazy evaluation of popup HTML content - only create it when it's definitely needed
                layer.addOneTimeEventListener('click', function () {
                    var content = VM.utils.renderFullDetailsForPlace(feature.properties);
                    if (layer.setPopupContent) {
                        layer.setPopupContent(content);
                    } else if (layer.invoke) {
                        layer.invoke('setPopupContent', content);
                    }
                });
                layer.bindPopup('');
                // console.log('onEachFeature', feature, layer);
            }
        }).addTo(map);
    }


    return VM;
})();
