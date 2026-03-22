const express = require('express');
const { readDestinations, writeDestinations } = require('../data/helpers');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const VALID_STATUS = ['want_to_go', 'planned', 'visited'];

function validateStatus(status) {
	return VALID_STATUS.includes(status);
}

router.use(authenticateToken);

router.get('/destinations', async (req, res) => {
	try {
		const destinations = await readDestinations();
		const userDestinations = destinations.filter((destination) => destination.user_id === req.user.id);
		return res.status(200).json({ destinations: userDestinations });
	} catch (error) {
		return res.status(500).json({ message: 'Unable to fetch destinations.', error: error.message });
	}
});

router.get('/destinations/:id', async (req, res) => {
	try {
		const destinations = await readDestinations();
		const destination = destinations.find(
			(item) => String(item.id) === req.params.id && item.user_id === req.user.id
		);

		if (!destination) {
			return res.status(404).json({ message: 'Destination not found' });
		}

		return res.status(200).json({ destination });
	} catch (error) {
		return res.status(500).json({ message: 'Unable to fetch destination.', error: error.message });
	}
});

router.post('/destinations', async (req, res) => {
	try {
		const { country_name, country_code, status = 'want_to_go', notes = '' } = req.body;

		if (!country_name || !country_code) {
			return res.status(400).json({ message: 'country_name and country_code are required' });
		}

		if (!validateStatus(status)) {
			return res.status(400).json({ message: 'Invalid status value' });
		}

		const destinations = await readDestinations();
		const existing = destinations.find(
			(item) => item.user_id === req.user.id && item.country_code === String(country_code).toUpperCase()
		);

		if (existing) {
			return res.status(400).json({ message: 'Destination already exists in your bucket list' });
		}

		const dateVisited = status === 'visited' ? new Date().toISOString() : null;
		const destination = {
			id: Date.now(),
			user_id: req.user.id,
			country_name: String(country_name),
			country_code: String(country_code).toUpperCase(),
			status,
			notes: String(notes || ''),
			date_visited: dateVisited,
			created_at: new Date().toISOString()
		};

		destinations.push(destination);
		await writeDestinations(destinations);
		return res.status(201).json({ destination });
	} catch (error) {
		return res.status(500).json({ message: 'Unable to create destination.', error: error.message });
	}
});

router.put('/destinations/:id', async (req, res) => {
	try {
		const { country_name, country_code, status, notes = '' } = req.body;
		if (!country_name || !country_code) {
			return res.status(400).json({ message: 'country_name and country_code are required' });
		}

		if (!validateStatus(status)) {
			return res.status(400).json({ message: 'Invalid status value' });
		}

		const destinations = await readDestinations();
		const index = destinations.findIndex(
			(item) => String(item.id) === req.params.id && item.user_id === req.user.id
		);

		if (index < 0) {
			return res.status(404).json({ message: 'Destination not found' });
		}

		const existing = destinations[index];
		const dateVisited =
			status === 'visited' && !existing.date_visited ? new Date().toISOString() : status === 'visited' ? existing.date_visited : null;

		destinations[index] = {
			...existing,
			country_name: String(country_name),
			country_code: String(country_code).toUpperCase(),
			status,
			notes: String(notes),
			date_visited: dateVisited
		};

		await writeDestinations(destinations);
		return res.status(200).json({ destination: destinations[index] });
	} catch (error) {
		return res.status(500).json({ message: 'Unable to update destination.', error: error.message });
	}
});

router.delete('/destinations/:id', async (req, res) => {
	try {
		const destinations = await readDestinations();
		const index = destinations.findIndex(
			(item) => String(item.id) === req.params.id && item.user_id === req.user.id
		);

		if (index < 0) {
			return res.status(404).json({ message: 'Destination not found' });
		}

		destinations.splice(index, 1);
		await writeDestinations(destinations);
		return res.status(200).json({ message: 'Destination deleted successfully' });
	} catch (error) {
		return res.status(500).json({ message: 'Unable to delete destination.', error: error.message });
	}
});

module.exports = router;
