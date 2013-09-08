(function () {
    var scope = typeof exports !== 'undefined' ? exports : (VM && VM.settings) || {};

    // Arbitrary maximum number of votes for a single polling place
    // Hard-coded to simplify calculations
    scope.voteMax = 3500;
    // Minimum radius in pixels of a polling place dot
    scope.sizeMin = 4;
    // Maximum radius in pixels of a polling place dot
    scope.sizeMax = 10;
    // Maximum radius in pixels of a combined set of polling places
    scope.combinedSizeMax = 20;
})();
