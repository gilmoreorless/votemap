var VM = (function () {
    var VM = {
        map: null,
        data: {},
        utils: {},
        settings: {},
        templates: {}
    };

    VM.settings = {
        colours: {
            TIED: '#ff00ff',
            ALP: '#ff0000',  // Australian Labor Party
            LP:  '#0000ff',  // Liberal Party (coalition)
            NP:  '#999900',  // National Party
            GRN: '#00ff00',  // The Greens
            IND: '#000000'   // Independent
        },
        voteType: 'tcp',  // 'tcp' or 'firstPrefs'
        // Placeholders - filled in by settings.js
        voteMax: 0,
        sizeMin: 0,
        sizeMax: 0
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
        // Informal votes need a separate entry
        VM.data.candidates.push({
            CandidateID: 999,
            PartyAb: 'INF',
            PartyNm: '',
            GivenNm: '',
            Surname: 'INFORMAL'
        });

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

    VM.utils.getColourForCandidate = function (candidate) {
        // Handle just a candidate ID
        if (_.isNumber(candidate)) {
            candidate = VM.data.candidates.byId[candidate];
        }

        var party = candidate.PartyAb;
        var colour = VM.settings.colours[party];
        if (!colour && (party in VM.data.partyColourAlias)) {
            colour = VM.settings.colours[VM.data.partyColourAlias[party]];
        }
        if (!colour) {
            colour = '#999';
        }
        return colour;
    };

    VM.utils.getStyleForFeature = function (feature) {
        var votesData = feature.properties.votes;
        var s = VM.settings;
        var totalVotes = votesData.totalVotes;
        if (!totalVotes) {
            totalVotes = votesData.totalVotes = VM.utils.sum(_.pluck(votesData, 'OrdinaryVotesFirstPrefs'));
        }
        var size = (totalVotes / s.voteMax) * (s.sizeMax - s.sizeMin) + s.sizeMin;

        var useFirstPrefs = VM.settings.voteType == 'firstPrefs';
        var propSuffix = useFirstPrefs ? 'FirstPrefs' : 'TCP';
        var voteProp = 'OrdinaryVotes' + propSuffix;
        var winProp = 'winningCandidate' + propSuffix;

        var winningCandidate = votesData[winProp];
        if (!winningCandidate) {
            var winningCandidateData = _.reduce(votesData, function (prevMax, voteData) {
                // TODO: Handle ties
                if (voteData[voteProp]) {
                    if (!prevMax[voteProp] || voteData[voteProp] > prevMax[voteProp]) {
                        return voteData;
                    }
                }
                return prevMax;
            }, {});
            winningCandidate = votesData[winProp] = VM.data.candidates.byId[winningCandidateData.CandidateID];
            if (!winningCandidate) {
                return {
                    fillOpacity: 0,
                    radius: 0
                };
            }
        }
        var colour = VM.utils.getColourForCandidate(winningCandidate);
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
        var data = _.clone(placeData);
        var useFirstPrefs = VM.settings.voteType == 'firstPrefs';
        var propSuffix = useFirstPrefs ? 'FirstPrefs' : 'TCP';
        var voteProp = 'OrdinaryVotes' + propSuffix;
        var swingProp = 'Swing' + propSuffix;

        data.candidates = _.chain(data.votes)
            .filter(function (voteData) {
                return !!voteData[voteProp];
            })
            .map(function (voteData) {
                var candidate = _.clone(VM.data.candidates.byId[voteData.CandidateID]);
                _.extend(candidate, voteData, {
                    colour: VM.utils.getColourForCandidate(candidate),
                    voteCount: voteData[voteProp],
                    voteSwing: voteData[swingProp]
                });
                return candidate;
            })
            .sortBy(function (c) {
                return -c.voteCount;
            })
            .value();
        return VM.templates.placePopup(data);
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

    L.hash(map);

    var placesLayer;
    function initPlaceLayer() {
        placesLayer = new L.TileLayer.GeoJSON('/data/places/tile/{z}/{x}/{y}?votes=min', {
            clipTiles: false,
            unique: function (feature) {
                return feature.id;
            }
        }, {
            style: VM.utils.getStyleForFeature,
            pointToLayer: function (feature, latlon) {
                return L.circleMarker(latlon);
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
            }
        }).addTo(map);

        // L.PieChartDataLayer
    }


    /*** DOM interaction ***/

    document.getElementById('controls').addEventListener('click', function (e) {
        if (e.target.nodeName != 'INPUT' || e.target.name != 'voteType') {
            return;
        }
        VM.settings.voteType = e.target.value;
        // TODO: Find a better way of redrawing that doesn't involve re-requesting all the tile data
        placesLayer.redraw();
    }, false);


    return VM;
})();
