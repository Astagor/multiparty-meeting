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

	db = new sqlite3.Database(dbPath);

	if (createNewDb)
	{
		logger.error('STATS CREATING TABLES');
		
		db.serialize(() => {
			db.run('CREATE TABLE sessions (room_id TEXT, session_id TEXT, created_on INTEGER DEFAULT 0, closed_on INTEGER DEFAULT 0)');
			db.run('CREATE TABLE users (session_id TEXT, email TEXT, start INTEGER DEFAULT 0, end INTEGER DEFAULT 0)');
			dumpDb();
		});
	}
	else
	{
		logger.error('STATS CLEANING UP');

		const now = Date.now();

		db.serialize(() => {
			db.run('UPDATE users SET end = ? WHERE end = 0', [now]);
			db.run('UPDATE sessions SET closed_on = ? WHERE closed_on = 0', [now]);
			dumpDb();
		});
	}
};

const dumpDb = function()
{
	logger.error('STATS DUMP');

	if (!db)
		throw new Error('DB not initialized!');

	db.each("SELECT * FROM sessions", (err, row) => {
		logger.error('Session: %o', row);
	});
	db.each("SELECT * FROM users", (err, row) => {
		logger.error('User: %o', row);
	});
};

module.exports.roomCreated = function(roomId, sessionId)
{
	if (!db)
		throw new Error('DB not initialized!');

	logger.error('STATS Room created');

	const now = Date.now();

	db.serialize(() => {
		db.run('INSERT INTO sessions (room_id, session_id, created_on) VALUES (?, ?, ?)', [roomId, sessionId, now]);
		dumpDb();
	});

};

module.exports.roomClosed = function(sessionId)
{
	logger.error('STATS Room closed');

	if (!db)
		throw new Error('DB not initialized!');

	const now = Date.now();

	db.serialize(() => {
		db.run('UPDATE users SET end = ? WHERE session_id = ? AND end = 0', [now, sessionId]);
		db.run('UPDATE sessions SET closed_on = ? WHERE session_id = ? AND closed_on = 0', [now, sessionId]);
		dumpDb();
	});
};

module.exports.peerJoined = function(sessionId, email)
{
	if (!db)
		throw new Error('DB not initialized!');

	logger.error('STATS Peer joined');

	if (!email)
		return;

	const now = Date.now();

	db.serialize(() => {
		db.run('INSERT INTO users (session_id, email, start) VALUES (?, ?, ?)', [sessionId, email, now]);
		dumpDb();
	});

};

module.exports.peerLeft = function(sessionId, email)
{
	if (!db)
		throw new Error('DB not initialized!');

	logger.error('STATS Peer joined');

	if (!email)
		return;

	const now = Date.now();

	db.serialize(() => {
		db.run('UPDATE users SET end = ? WHERE session_id = ? AND email = ? AND end = 0', [now, sessionId, email]);
		dumpDb();
	});

};
