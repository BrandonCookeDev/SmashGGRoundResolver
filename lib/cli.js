'use strict';

const program = require('commander');
const puller = require('./puller');

program	
	.version('1.0.0')
	.option('-t, --tournament <string>', 'Tournament slug from smashgg url')
	.option('-e, --event <string>', 'Event slug from smashgg url')
	.option('-1, --player1 <player1>', 'Player tag from the match')
	.option('-2, --player2 <player2>', 'Player tag from the match')
	.parse(process.argv);

let players = [program.player1, program.player2];
let player1 = program.player1;
let player2 = program.player2;
let tournament = program.tournament;
let event = program.event;

(async function(){
	let sets = await puller.getMatchingSets(tournament, event, player1, player2)
	if(sets.length)
	{
		sets.forEach(set => {
			console.log(set.getRound());
		});
	}
	return true;
})();