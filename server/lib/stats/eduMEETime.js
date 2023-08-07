const fs = require('fs');
import Logger from '../logger/Logger';
const logger = new Logger('eduMEETime');
const sqlite3 = require('sqlite3').verbose();

const dbPath = __dirname + '/../../../lib/stats/eduMEETime.db';

import { config } from '../config/config';


let db = null;


module.exports.init = function()
{
	logger.error('STATS Init DB');

	if (db)
		return;

	let createNewDb = true;

	if (fs.existsSync(dbPath))
		createNewDb = false;

	const db = new sqlite3.Database(dbPath);

	if (createNewDb)
	{
		logger.error('STATS CREATING TABLES');
		
		db.serialize(() => {
			db.run('CREATE TABLE sessions (room_id INTEGER, created_on INTEGER DEFAULT 0, closed_on INTEGER DEFAULT 0)');
			db.run('CREATE TABLE users (session_id INTEGER, email TEXT, start INTEGER DEFAULT 0, end INTEGER DEFAULT 0)');
		});
	}
	else
	{
		logger.error('STATS CLEANING UP');

		const now = Date.now();

		db.serialize(() => {
			db.run('UPDATE users SET end = "+now+" WHERE end = 0');
			db.run('UPDATE sessions SET closed_on = '+now+' WHERE closed_on = 0');
		});
	}
};

module.exports.dumpDb = function()
{
	logger.error('STATS DUMP');

	if (!db)
		throw new Error('DB not initialized!');

	logger.error('------ SESSIONS START ------');
	db.each("SELECT rowid, room_id, created_on, closed_on FROM sessions", (err, row) => {
		logger.error('%o', row);
	});
	logger.error('------ SESSIONS END ------');

	logger.error('------ USERS START ------');
	db.each("SELECT rowid, session_id, email, start, end FROM users", (err, row) => {
		logger.error('%o', row);
	});
	logger.error('------ USERS END ------');
};

module.exports.roomCreated = function(roomId)
{
	if (!db)
		throw new Error('DB not initialized!');

	logger.error('STATS Room created');

	const now = Date.now();

	db.serialize(() => {
		db.run('INSERT INTO sessions (room_id, created_on) VALUES ("'+roomId+'", '+now+')');
	});

};

module.exports.roomClosed = function(roomId)
{
	logger.error('STATS Room closed');

	if (!db)
		throw new Error('DB not initialized!');

	const now = Date.now();

	db.serialize(() => {
		db.run('UPDATE sessions SET closed_on = '+now+' WHERE room_id = "'+roomId+'" AND closed_on = 0');
	});
};
