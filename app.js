const _     = require('lodash');
const co    = require('co');
const log   = require('winston');
const wreck = require('wreck');
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');
const format  = require('util').format;
const cache   = require('./cache').instance;

var TOURNAMENT_URL = 'https://api.smash.gg/tournament/%s?expand[]=event&expand[]=phase';
var EVENT_URL = 'https://api.smash.gg/event/%s?expand[]=phase&expand[]=groups'
var PHASE_URL = 'https://api.smash.gg/phase/%s?expand[]=groups';
var GROUP_URL = 'https://api.smash.gg/phase_group/%s?expand[]=sets&expand[]=entrants&expand[]=standings';

var tournament = 'function1';

tournamentUrl = format(TOURNAMENT_URL, tournament);


var phaseIds = [];
var groupIds = [];

Uint8Array.prototype.decodeJSON = function(){
    return JSON.parse(decoder.write(this));
};

getAllPlayers(tournament);

/*
getTournamentData(tournament)
    .then(function(tournamentData){

        var events = tournamentData.event;
        events.forEach(function(event){
            var eventId = event.id;

            getEventData(eventId)
                .then(function(eventData){

                    var phases = eventData.phase;
                    phases.forEach(function (phase) {
                        var phaseId = phase.id;
                        phaseIds.push(phaseId);

                        getPhaseData(phaseId)
                            .then(function(phaseData){

                                var phaseId = phaseData.phase.id;
                                var groups = phaseData.groups;
                                groups.forEach(function (group) {
                                    var groupId = group.id;

                                    getGroupData(groupId)
                                        .then(function(groupData){

                                            groupId = groupData.group.id;


                                        }).catch(log.error)

                                })
                        }).catch(log.error);
                    })
                }).catch(log.error);
        })
    }).catch(log.error);
*/


function getTournamentData(tournamentName){
    return new Promise(function(resolve, reject){
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
    })
}

function getPhaseData(id){
    return new Promise(function(resolve, reject){
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
    })
}

function getAllPlayers(tournamentName){
    return new Promise(function(resolve, reject){
        co(function*() {
            var players = {};

            var cachedValue = yield cache.checkCacheForTournamentPlayers(tournamentName);
            if (cachedValue) resolve(cachedValue);
            else {
                getGroupsFromTournamentName(tournamentName)
                    .then(function (groups) {
                        console.log(groups);
                    }).catch(log.error);
            }
        }).catch(function(err){
            log.error(err);
            return reject(err);
        })
    })
}

function getGroupsFromTournamentName(tournamentName){
    return new Promise(function(resolve, reject){
        var groupData = [];
        getTournamentData(tournamentName)
            .then(function (tournamentData) {
                var phases = tournamentData.phase;

                phases.forEach(function(phase){
                    var phaseId = phase.id;

                    getPhaseData(phaseId)
                        .then(function(phaseData){
                            var groups = phaseData.groups;

                            co(function*() {
                                for(var i=0; i<groups.length; i++) {
                                    var group = groups[i];
                                    var groupId = group.id;

                                    var data = yield getGroupData(groupId);
                                    groupData.push(data);
                                }

                                resolve(groupData);
                            })
                        }).catch(reject);
                })
            }).catch(reject);
    })
}