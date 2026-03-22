const fs = require('fs/promises');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');
const DESTINATIONS_FILE = path.join(__dirname, 'destinations.json');

async function readFileAsJson(filePath, fallbackValue = []) {
	try {
		const raw = await fs.readFile(filePath, 'utf-8');
		const trimmed = raw.trim();
		if (!trimmed) {
			return fallbackValue;
		}

		return JSON.parse(trimmed);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return fallbackValue;
		}

		throw error;
	}
}

async function writeFileAsJson(filePath, data) {
	await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

async function readUsers() {
	return readFileAsJson(USERS_FILE, []);
}

async function writeUsers(users) {
	return writeFileAsJson(USERS_FILE, users);
}

async function readDestinations() {
	return readFileAsJson(DESTINATIONS_FILE, []);
}

async function writeDestinations(destinations) {
	return writeFileAsJson(DESTINATIONS_FILE, destinations);
}

module.exports = {
	readUsers,
	writeUsers,
	readDestinations,
	writeDestinations
};
