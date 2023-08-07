import Logger from '../logger/Logger';
const logger = new Logger('eduMEETime');

import { config } from '../config/config';

module.exports.roomCreated = function(roomId, roomHash)
{
	logger.error('STATS Room created');
};

module.exports.roomClosed = function(roomId, roomHash)
{
	logger.error('STATS Room closed');
};
