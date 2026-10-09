const winston = require('winston');
const path = require('path');

const transports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    })
];

if (!process.env.VERCEL) {
    require('winston-daily-rotate-file');
    transports.push(new winston.transports.DailyRotateFile({
        filename: path.join(__dirname, '../logs/application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d'
    }));
}

module.exports = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports
});
