'use strict';

class Player{
    constructor(tag, globalId, entrantId){
        this.tag = tag;
        this.globalId = globalId;
        this.entrantId = entrantId;

        if(tag.indexOf('|') >= 0) {
            var split = tag.split('|');
            this.sponsor = split[0];
            this.tag = split[1];
        }
    }
}

module.exports = Player;
