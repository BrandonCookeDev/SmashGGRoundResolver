'use strict';

const { Event, Set } = require('smashgg.js');
const log = require('./Util/Logger');

class Puller{

	static async getMatchingSets(tournamentName, eventName, tag1, tag2){
		try{
			if(!tournamentName)
				throw new Error('tournament name cannot be null');
			if(!eventName)
				throw new Error('event name cannot be null');
			if(!tag1)
				throw new Error('tag1 cannot be null');
			if(!tag2)
				throw new Error('tag2 cannot be null');

			let event = await Event.getEvent(eventName, tournamentName, {rawEncoding: 'base64'});
			let sets = await event.getIncompleteSets();
			let filtered = sets.filter(set => { 
				let players = [set.getPlayer1().getTag().toLowerCase(), set.getPlayer2().getTag().toLowerCase()];
				return players.includes(tag1.toLowerCase()) && players.includes(tag2.toLowerCase());
			})
			return filtered;
		} catch(e){
			log.error(e);
			throw e;
		}
	}
}

module.exports = Puller;