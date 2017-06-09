'use strict';

var log = require('../Logger');
var Event = require('./Event');

const wreck = require('wreck');
const TOURNAMENT_URL = 'https://api.smash.gg/tournament/%s?expand[]=event&expand[]=phase';

class Tournament{
    constructor(tournamentName){
        this.tournamentName = tournamentName;
        this.events = [];
    }

    getTournamentData(){
        let This = this;
        return new Promise(function(resolve, reject){
            log.debug('Getting tournament data for ' + This.tournamentName);
            try {

                var tournamentUrl = format(TOURNAMENT_URL, This.tournamentName);
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

    getEvents(){
        let This = this;
        return new Promise(function(resolve, reject){
            This.getTournamentData()
                .then(function(data){

                    //resolve(data.events)
                })
                .catch(reject);
        })
    }

}

module.exports = Tournament;