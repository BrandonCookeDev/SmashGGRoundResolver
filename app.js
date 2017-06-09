var co  = require('co');
var log = require('./lib/Logger');

const express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var lib = require('./smashgg.lib');

var port = 11769;

app.get('/init/:tournamentName', function(req, res){
    try {
        var tournamentName = req.params.tournamentName;
        lib.init(tournamentName)
            .then(function(){res.sendStatus(200);})
            .catch(function(err){res.status(500).send(err)})
    }catch(err){
        res.status(500).send(err);
    }
});

app.post('/getMatch', function(req, res){
    try {
        co(function*(){
            var tournamentName = req.body.tournament;
            var tag1 = req.body.tag1;
            var tag2 = req.body.tag2;

            var matches = yield lib.getMatches(tournamentName);
            var match = lib.findMatch(tag1, tag2, matches);
            res.status(200).send(match);
        }).catch(function(err){res.status(500).send(err)})
    }catch(err){
        log.error(err);
        res.status(500).send(err);
    }
});

app.listen(port, function(){
    console.log('app.listening on port ', port);
});