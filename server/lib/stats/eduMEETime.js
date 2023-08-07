const fs = require('fs');
import Logger from '../logger/Logger';
const logger = new Logger('eduMEETime');
const sqlite3 = require('sqlite3').verbose();

const dbPath = __dirname + '/../../../lib/stats/eduMEETime.db';

let db = null;

import { config } from '../config/config';

module.exports.init = function()
{
	logger.error('STATS Init DB');

	if (db)
		return;

	let createNewDb = true;

	if (fs.existsSync(dbPath))
		createNewDb = false;

	db = new sqlite3.Database(dbPath);

	if (createNewDb)
	{
		db.serialize(() => {
			db.run('CREATE TABLE sessions (room_id INTEGER, created_on INTEGER DEFAULT 0, closed_on INTEGER DEFAULT 0)');
			db.run('CREATE TABLE users (session_id INTEGER, email TEXT, start INTEGER DEFAULT 0, end INTEGER DEFAULT 0)');
		});
	}
	else
	{
		const now = Date.now();

		db.serialize(() => {
			db.run('UPDATE users SET end = "+now+" WHERE end = 0');
			db.run('UPDATE sessions SET closed_on = '+now+' WHERE closed_on = 0');
		});
	}
};

module.exports.close = function()
{
	logger.error('STATS close DB');

	if (db)
		db.close();
};

module.exports.roomCreated = function(roomId)
{
	logger.error('STATS Room created');

	if (db)
		throw new Error('DB not opened!');

	const now = Date.now();

	db.serialize(() => {
		db.run('INSERT INTO sessions (room_id, created_on) VALUES ("'+roomId+'", '+now+')');
	});

};

module.exports.roomClosed = function(roomId)
{
	logger.error('STATS Room closed');

	if (db)
		throw new Error('DB not opened!');

	const now = Date.now();

	db.serialize(() => {
		db.run('UPDATE sessions SET closed_on = '+now+' WHERE room_id = "'+roomId+'"" AND closed_on = 0');
	});
};
