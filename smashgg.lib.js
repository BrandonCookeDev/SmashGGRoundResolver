'use strict';

var Promise = require('bluebird');

const _     = require('lodash');
const co    = require('co');
const wreck = require('wreck');
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');
const format  = require('util').format;

const cache   = require('./lib/Cache').instance;
let log       = require('./lib/Logger');
let Player    = require('./lib/Objects/Player');
let Match     = require('./lib/Objects/Match');

var TOURNAMENT_URL = 'https://api.smash.gg/tournament/%s?expand[]=event&expand[]=phase';
var EVENT_URL = 'https://api.smash.gg/event/%s?expand[]=phase&expand[]=groups';
var PHASE_URL = 'https://api.smash.gg/phase/%s?expand[]=groups';
var GROUP_URL = 'https://api.smash.gg/phase_group/%s?expand[]=sets&expand[]=entrants&expand[]=standings';

Uint8Array.prototype.decodeJSON = function(){
    return JSON.parse(decoder.write(this));
};


function getTournamentData(tournamentName){
    return new Promise(function(resolve, reject){
        log.debug('Getting tournament data for ' + tournamentName);
        try {

            var tournamentUrl = format(TOURNAMENT_URL, tournamentName);
            wreck.get(tournamentUrl, function (err, res, data) {
                if(err){
                    log.error(err);
                    return reject(err);
                }

                var tournamentData = data.decodeJSON();
                resolve(tournamentData.entities);
            })

        }catch(err){
            if(err){
                log.error(err);
                return reject(err);
            }
            return reject('unknown error getting phase data');
        }
    })
}

function getEventData(id){
    return new Promise(function(resolve, reject){
        log.debug('Getting event data for ' + id);
        try {

            var eventUrl = format(EVENT_URL, id);
            wreck.get(eventUrl, function (err, res, data) {
                if(err){
                    log.error(err);
                    return reject(err);
                }

                var eventData = data.decodeJSON();
                resolve(eventData.entities);
            })

        }catch(err){
            if(err){
                log.error(err);
                return reject(err);
            }
            return reject('unknown error getting phase data');
        }
    })
}

function getGroupData(id){
    return new Promise(function(resolve, reject){
        log.debug('Getting group data for ' + id);
        try {

            var groupUrl = format(GROUP_URL, id);
            wreck.get(groupUrl, function (err, res, data) {
                if(err){
                    log.error(err);
                    return reject(err);
                }

                var groupData = data.decodeJSON();
                resolve(groupData.entities);
            })

        }catch(err){
            if(err){
                log.error(err);
                return reject(err);
            }
            return reject('unknown error getting phase data');
        }
    }).catch(log.error);
}

function getPhaseData(id){
    return new Promise(function(resolve, reject){
        log.debug('Getting phase data for ' + id);

        try {

            var phaseUrl = format(PHASE_URL, id);
            wreck.get(phaseUrl, function (err, res, data) {
                if(err){
                    log.error(err);
                    return reject(err);
                }

                var phaseData = data.decodeJSON();
                resolve(phaseData.entities);
            })

        }catch(err){
            if(err){
                log.error(err);
                return reject(err);
            }
            return reject('unknown error getting phase data');
        }
    }).catch(log.error);
}

function getAllPlayers(tournamentName){
    return new Promise(function(resolve, reject){
        co(function*() {
            var players = {};

            var cachedValue = yield cache.checkCacheForTournamentPlayers(tournamentName);
            if (cachedValue) resolve(cachedValue);
            else {
                getGroupsFromTournamentName(tournamentName)
                    .then(function(groups) {
                        var players = [];
                        groups.forEach(function(group){
                            var groupPlayers = getPlayersFromGroup(group);
                            players = players.concat(groupPlayers)
                        });

                        players = _.uniqBy(players, function(p){return p.entrantId});

                        cache.cacheTournamentPlayers(tournamentName, players);
                        resolve(players);
                    }).catch(log.error);
            }
        }).catch(function(err){
            log.error(err);
            return reject(err);
        })
    }).catch(log.error);
}

function getPlayersFromGroup(group){
    var players = [];
    var groupPlayers = group.player;
    if(groupPlayers) {
        groupPlayers.forEach(function (player) {
            var tag, globalId, entrantId;
            tag = player.gamerTag;
            globalId = player.id;
            entrantId = parseInt(player.entrantId);

            var p = new Player(tag, globalId, entrantId);
            players.push(p);
        });
    }
    return players;
}

function cacheIndividualPlayers(players){
    return new Promise(function(resolve, reject){
        var promises = [];
        players.forEach(function(player){
            promises.push(cache.cacheTournamentPlayer(player));
        });

        Promise.all(promises)
            .then(function(values){
                log.info('Cached players successfully');
                resolve();
            })
            .catch(reject);
    }).catch(log.error);

}

function getGroupsFromTournamentName(tournamentName){
    return new Promise(function(resolve, reject){
        log.debug('Getting all group data for ' + tournamentName);

        var groupData = [];
        getTournamentData(tournamentName)
            .then(function (tournamentData) {
                var phasePromises = [];
                var phases = tournamentData.phase;

                phases.forEach(function(phase){
                    var promise = getPhaseData(phase.id);
                    phasePromises.push(promise);
                });

                Promise.all(phasePromises)
                    .then(function(phaseDataArr){
                        var groupPromises = [];
                        phaseDataArr.forEach(function(phase){
                            var groups = phase.groups;
                            groups.forEach(function(group){
                                var promise = getGroupData(group.id);
                                groupPromises.push(promise);
                            });
                        });

                        Promise.all(groupPromises)
                            .then(function(groupDataArr){
                                resolve(groupDataArr);
                            }).catch(reject);
                    })
                    .catch(reject);
            }).catch(reject);
    }).catch(log.error);
}

function getMatches(tournamentName){
    return new Promise(function(resolve, reject){
        log.verbose('Getting matches for ' + tournamentName);
        getGroupsFromTournamentName(tournamentName)
            .then(function(groups){
                if(groups) {
                    var promises = [];
                    var sets = [];

                    groups.forEach(function (group) {
                        //promises.push(getMatchesFromGroup(group))
                        sets = sets.concat(group.sets);
                    });

                    sets.forEach(function (set) {
                        var player1Id = set.entrant1Id;
                        var player2Id = set.entrant2Id;
                        if (!player1Id || !player2Id) return;

                        promises.push(getMatchFromSet(player1Id, player2Id, set));
                    });

                    Promise.all(promises)
                        .then(function (values) {
                            try {
                                var matches = _.flatten(values);
                                resolve(matches);
                            } catch (err) {
                                reject(err)
                            }
                        })
                        .catch(reject);
                }
            }).catch(reject)
    }).catch(log.error);
}


/**
 * error exists in this
 * @param group
 * @returns {Promise.<T>}
 */
function getMatchesFromGroup(group){
    return new Promise(function(resolve, reject){
        log.verbose('Getting matches for group ' + group.groups.id);
        var promises = [];
        for (var i in group.sets) {
            var set = group.sets[i];

            var player1Id = set.entrant1Id;
            var player2Id = set.entrant2Id;
            if (!player1Id || !player2Id) return;

            promises.push(getMatchFromSet(player1Id, player2Id, set));
        }

        Promise.all(promises)
            .then(function(matches){
                try {
                    //matches = _.uniqBy(matches, function (m) {
                    //    return [m.Player1.tag, m.Player2.tag, m.Round, m.BO].join()
                    //});
                    resolve(matches);
                }catch(err){reject(err)}
            })
            .catch(reject)
    }).catch(log.error)
}

function getMatchFromSet(player1Id, player2Id, set){
    return new Promise(function (resolve, reject) {
        log.verbose('Generating match ' + player1Id + ' - ' + player2Id + ' - ' + set.midRoundText);
        resolvePlayers(player1Id, player2Id)
            .then(function (players) {
                try {
                    var player1 = players[0];
                    var player2 = players[1];

                    var bo = set.bestOf;
                    var round = set.midRoundText;

                    var m = new Match(player1, player2, round, bo);
                    log.debug('Adding match: ', m);
                    resolve(m);
                }catch(err){reject(err)}
            })
            .catch(reject)
    }).catch(log.error);
}

/**
 * Takes a variable amount of entrantIds
 * and resolves a list of players
 */
function resolvePlayers(id1, id2){
    return new Promise(function(resolve, reject){
        log.verbose('Resolving players ' + id1 + ' and ' + id2);

        var promises = [];
        promises.push(cache.checkCacheForTournamentPlayer(id1));
        promises.push(cache.checkCacheForTournamentPlayer(id2));

        Promise.all(promises)
            .then(resolve)
            .catch(reject)
    }).catch(log.error);
}

function findMatch(p1tag, p2tag, matches){
    var matches = _.findLast(matches, function(match){
        return (
            (match.Player1.tag.toLowerCase() == p1tag.toLowerCase() &&
             match.Player2.tag.toLowerCase() == p2tag.toLowerCase() )

            ||

            (match.Player2.tag.toLowerCase() == p1tag.toLowerCase() &&
             match.Player1.tag.toLowerCase() == p2tag.toLowerCase())
        )
    });
    console.log(matches);
    return matches;
}

function init(tournamentName) {
    co(function*() {
        var players = yield getAllPlayers(tournamentName);
        yield cacheIndividualPlayers(players);
        //var matches = yield getMatches(tournamentName);
    }).catch(function(err){
        log.error(err);
        process.exit(1);
    })
}

module.exports = {
    init: init,
    findMatch: findMatch,
    getMatches: getMatches
};