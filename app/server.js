/*!
 * Main server
 */

var express = require('express');
var app = express();

app.set('views', __dirname + '/views');
app.use(express.logger('dev'));
app.use(express.static(__dirname + '/static'));
app.engine('html', require('hjs').__express);
app.set('view engine', 'hjs');

app.get('/', function (req, res) {
    res.render('index.html');
});

app.listen(parseInt(process.env.PORT || 9876, 10));
