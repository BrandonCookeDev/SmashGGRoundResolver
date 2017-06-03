const path = require('path');

let winston = require('winston');

winston.remove(winston.transports.Console);

transports = {
    file:{
        filename: path.join(__dirname, 'log', 'smashgg.log'),
        level: 'warn',
        colorize: false,
        json: false,
        handleExceptions: true
    },
    console:{
        level: 'debug',
        colorize: true,
        handleExceptions: true,
        json: false
    }
};

let logger = new winston.Logger({
    transports: [
        new winston.transports.File(transports.file),
        new winston.transports.Console(transports.console)
    ]
});
module.exports = logger;