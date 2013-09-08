function Logger(prefix) {
    this.prefix = prefix || '';
    this.startTime = Date.now();
}

Logger.prototype.log = function (data) {
    console.log(this.prefix, data);
    return data;
};

Logger.prototype.logTime = function (data) {
    var now = Date.now();
    var diff = now - this.startTime;
    console.log('TIMER', this.prefix, diff + 'ms');
    return data;
};

Logger.prototype.timerPromise = function () {
    return this.logTime.bind(this);
};

Logger.prototype.error = function (req, opts, reason) {
    reason = reason || {};
    var stack = reason.stack || '';
    console.error('Error ' + req.method + ' ' + this.prefix);
    console.error(' |- opts', opts || {});
    if (stack) {
        console.error(' |- reason', reason);
        console.error(' \\- stack', stack);
    } else {
        console.error(' \\- reason', reason);
    }
    return this;
};

exports.create = function (prefix) {
    return new Logger(prefix);
};
