'use strict';

const _      = require('lodash');
const log    = require('winston');
const format = require('util').format;
const NodeCache = require('node-cache');

let keys = {
    tournamentId: 'id::tournament::%s',
    phaseIds: 'ids::phase::%s',
    groupIds: 'ids::group::%s',
    players: 'players::%s'
};

class Cache{
    static init(){
        if(!Cache.cache){
            Cache.cache = new NodeCache({
                stdTTL: 15000,
                checkperiod: 2000
            });
        }
    }

    static destroy(){
        Cache.cache.flushAll();
        Cache.cache.close();
    }

    static cacheTournamentPlayers(tournamentName, players){
        return new Promise(function(resolve, reject){
            var uid = format(keys.players, tournamentName);
            Cache.cache.set(uid, players,function(err, success){
                if(!err && success) resolve(success);
                else reject(err);
            })
        })
    }

    static checkCacheForTournamentPlayers(tournamentName){
        return new Promise(function(resolve, reject){
            var uid = format(keys.players, tournamentName);
            Cache.cache.get(uid,function(err, value){
                if(err) reject(err);
                else resolve(value);
            })
        })
    }

    static cacheTournamentId(tournamentName, tournamentId){

    }
}

/** DEFINE THE CACHE OBJECT AS A SINGLETON **/
let singleton = {};

const CACHE_KEY = Symbol.for('ECX.SPLASH.CACHE');

let globalSymbols = Object.getOwnPropertySymbols(global);
let hasCache      = (globalSymbols.indexOf(CACHE_KEY) > -1);

if(!hasCache){
    Cache.init();
    global[CACHE_KEY] = Cache
}

Object.defineProperty(singleton, "instance", {
    get: function(){
        return global[CACHE_KEY];
    }
});

Object.freeze(singleton);

module.exports = singleton;