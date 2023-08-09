const fs = require('fs');
import Logger from '../logger/Logger';
const logger = new Logger('eduMEETime');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');

const dbPath = __dirname + '/../../../lib/stats/eduMEETime.db';

import { config } from '../config/config';


let db = null;


module.exports.init = function()
{
	logger.debug('Init DB');

	if (db)
		return;

	let createNewDb = true;

	if (fs.existsSync(dbPath))
		createNewDb = false;

	db = new sqlite3.Database(dbPath);

	if (createNewDb)
	{
		logger.debug('CREATING TABLES');
		
		db.run('CREATE TABLE sessions (room_id TEXT, session_id TEXT, created_on INTEGER DEFAULT 0, closed_on INTEGER DEFAULT 0)');
		db.run('CREATE TABLE users (session_id TEXT, email TEXT, start INTEGER DEFAULT 0, end INTEGER DEFAULT 0)');
	}
	else
	{
		logger.debug('CLEANING UP');

		const now = Date.now();

		db.run('UPDATE users SET end = ? WHERE end = 0', [now]);
		db.run('UPDATE sessions SET closed_on = ? WHERE closed_on = 0', [now]);
	}

	const app = express();

	app.get('/', async (req, res) =>
	{
		logger.debug(`GET ${req.originalUrl}`);

		if (config.edumeetime.secret && req.headers.authorization !== `Bearer ${ config.edumeetime.secret}`)
		{
			logger.error('Invalid authorization header');

			return res.status(401).end();
		}

		res.set('Content-Type', 'application/json');
		res.end(JSON.stringify(await getAllLogs(), null, 4));
	});

	app.get('/current', async (req, res) =>
	{
		logger.debug(`GET ${req.originalUrl}`);

		if (config.edumeetime.secret && req.headers.authorization !== `Bearer ${ config.edumeetime.secret}`)
		{
			logger.error('Invalid authorization header');

			return res.status(401).end();
		}

		res.set('Content-Type', 'application/json');
		res.end(JSON.stringify(await getAllOpenMeetings(), null, 4));
	});

	app.get('/passed', async (req, res) =>
	{
		logger.debug(`GET ${req.originalUrl}`);

		if (config.edumeetime.secret && req.headers.authorization !== `Bearer ${ config.edumeetime.secret}`)
		{
			logger.error('Invalid authorization header');

			return res.status(401).end();
		}

		res.set('Content-Type', 'application/json');
		res.end(JSON.stringify(await getAllClosedMeetings(), null, 4));
	});

	const server = app.listen(config.edumeetime.port, config.edumeetime.listen, () =>
	{
		const address = server.address();

		logger.info(`listening ${address.address}:${address.port}`);
	});
};

module.exports.dumpDb = async function()
{
	logger.debug('dumpDb: %o', JSON.stringify(await getAllLogs(), null, 4));
};

const getAllOpenMeetings = async function()
{
	logger.debug('getAllOpenMeetings');

	if (!config.edumeetime.enabled)
		return;

	if (!db)
		throw new Error('DB not initialized!');

	const result = await new Promise((resolve, reject) => 
	{
		const data = [];
		const sessionMap = {};

		db.serialize(() =>
		{
			db.all('SELECT * FROM sessions WHERE closed_on = 0 ORDER BY created_on DESC', (err, rows) => {

				if (err)
					reject([]);

				for (let row of rows)
				{
					if (!sessionMap[row.session_id])
						continue;

					const session = {...row};
					session.users = [];
					data.push(session);
					sessionMap[session.session_id] = session;
				}

				db.all('SELECT * FROM users WHERE end = 0 ORDER BY start ASC', (err, rows) => {
					if (err)
						reject([]);

					for (let row of rows)
					{
						if (!sessionMap[row.session_id])
							continue;

						const user = {...row};
						sessionMap[user.session_id].users.push(user);
						delete user.session_id;
					}

					resolve(data);
				});
			});
		});
	});

	return result;
};

const getAllClosedMeetings = async function()
{
	logger.debug('getAllClosedMeetings');

	if (!config.edumeetime.enabled)
		return;

	if (!db)
		throw new Error('DB not initialized!');

	const result = await new Promise((resolve, reject) => 
	{
		const data = [];
		const sessionMap = {};

		db.serialize(() =>
		{
			db.all('SELECT * FROM sessions WHERE closed_on != 0 ORDER BY created_on DESC', (err, rows) => {

				if (err)
					reject([]);

				for (let row of rows)
				{
					const session = {...row};
					session.users = [];
					data.push(session);
					sessionMap[session.session_id] = session;
				}

				db.all('SELECT * FROM users ORDER BY start ASC', (err, rows) => {
					if (err)
						reject([]);

					for (let row of rows)
					{
						if (!sessionMap[row.session_id])
							continue;

						const user = {...row};
						if (user.end === 0)
						{
							user.end = sessionMap[user.session_id].closed_on;
						}
						sessionMap[user.session_id].users.push(user);
						delete user.session_id;
					}

					resolve(data);
				});
			});
		});
	});

	return result;
};

const getAllLogs = async function()
{
	logger.debug('getAllLogs');

	if (!config.edumeetime.enabled)
		return;

	if (!db)
		throw new Error('DB not initialized!');

	const result = await new Promise((resolve, reject) => 
	{
		const data = [];
		const sessionMap = {};

		db.serialize(() =>
		{
			db.all('SELECT * FROM sessions ORDER BY created_on DESC', (err, rows) => {

				if (err)
					reject([]);

				for (let row of rows)
				{
					const session = {...row};
					session.users = [];
					data.push(session);
					sessionMap[session.session_id] = session;
				}

				db.all('SELECT * FROM users ORDER BY start ASC', (err, rows) => {
					if (err)
						reject([]);

					for (let row of rows)
					{
						const user = {...row};
						sessionMap[user.session_id].users.push(user);
						delete user.session_id;
					}

					resolve(data);
				});
			});
		});
	});

	return result;
};

module.exports.roomCreated = function(roomId, sessionId)
{
	logger.debug('Room created');

	if (!config.edumeetime.enabled)
		return;

	if (!db)
		throw new Error('DB not initialized!');

	const now = Date.now();

	db.run('INSERT INTO sessions (room_id, session_id, created_on) VALUES (?, ?, ?)', [roomId, sessionId, now]);
};

module.exports.roomClosed = function(sessionId)
{
	logger.debug('Room closed');

	if (!config.edumeetime.enabled)
		return;

	if (!db)
		throw new Error('DB not initialized!');

	const now = Date.now();

	db.run('UPDATE users SET end = ? WHERE session_id = ? AND end = 0', [now, sessionId]);
	db.run('UPDATE sessions SET closed_on = ? WHERE session_id = ? AND closed_on = 0', [now, sessionId]);
};

module.exports.peerJoined = function(sessionId, email)
{
	logger.debug('Peer joined');

	if (!config.edumeetime.enabled)
		return;

	if (!db)
		throw new Error('DB not initialized!');

	if (!email)
		return;

	const now = Date.now();

	db.run('INSERT INTO users (session_id, email, start) VALUES (?, ?, ?)', [sessionId, email, now]);
};

module.exports.peerLeft = function(sessionId, email)
{
	logger.debug('Peer joined');

	if (!config.edumeetime.enabled)
		return;

	if (!db)
		throw new Error('DB not initialized!');

	if (!email)
		return;

	const now = Date.now();

	db.run('UPDATE users SET end = ? WHERE session_id = ? AND email = ? AND end = 0', [now, sessionId, email]);
};
