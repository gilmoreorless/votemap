/**
 * Reference functions only, they need .toString() and JSON.stringify() before shoving into JSON files
 */

// Conversion
var fn = //function
JSON.stringify(fn.toString()).replace(/\\n/g, ' ').replace(/\s{2,}/g, ' ');

// candidates/by_division_id
function (doc) {
  if (doc.datatype == 'candidate') {
    emit(doc.DivisionID, doc);
  }
}

// places/votes
function (doc) {
  if (doc.datatype == 'votes-by-place') {
    var props = [
      'PollingPlaceID', 'PollingPlace',
      'CandidateID', 'GivenNm', 'Surname', 'PartyAb', 'PartyNm', 'Elected',
      'OrdinaryVotesFirstPrefs', 'OrdinaryVotesTCP',
      'SwingFirstPrefs', 'SwingTCP'
    ];
    var value = {}, prop;
    for (var i = 0, ii = props.length; i < ii; i++) {
      prop = props[i];
      value[prop] = doc[prop];
    }
    emit(doc.PollingPlaceID, value);
  }
}

// places/_spacial/for_bounds
function (doc) {
  if (doc.datatype == 'place') {
    emit({
      type: 'Point',
      coordinates: [doc.Longitude, doc.Latitude]
    }, doc);
  }
}
