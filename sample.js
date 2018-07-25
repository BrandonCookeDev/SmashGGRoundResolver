'use strict';

let Puller = require('./lib/puller');

(async function(){
	let sets;

	sets = await Puller.getMatchingSets('21xx-cameron-s-birthday-bash-1', 'melee-singles', 'Silver', 'Colbol');
	console.log(sets.length);
	sets.forEach(set => {
		console.log(set.getRound())
	})

	sets = await Puller.getMatchingSets('21xx-cameron-s-birthday-bash-1', 'melee-singles', 'Dusk', 'Colbol');
	console.log(sets.length);
	sets.forEach(set => {
		console.log(set.getRound())
	})

	return true; 
})()