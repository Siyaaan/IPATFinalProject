const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { readUsers, writeUsers } = require('../data/helpers');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		const users = await readUsers();
		const normalizedEmail = String(email).toLowerCase().trim();
		const existingUser = users.find((user) => user.email === normalizedEmail);

		if (existingUser) {
			return res.status(400).json({ message: 'Email already registered' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = {
			id: Date.now(),
			name: String(name).trim(),
			email: normalizedEmail,
			password: hashedPassword,
			created_at: new Date().toISOString()
		};

		users.push(newUser);
		await writeUsers(users);

		return res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		return res.status(500).json({ message: 'Unable to register user.', error: error.message });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required.' });
		}

		const users = await readUsers();
		const normalizedEmail = String(email).toLowerCase().trim();
		const user = users.find((candidate) => candidate.email === normalizedEmail);

		if (!user) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const storedPassword = user.password || user.passwordHash;
		if (!storedPassword) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const isValid = await bcrypt.compare(password, storedPassword);
		if (!isValid) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
		return res.status(200).json({ token });
	} catch (error) {
		return res.status(500).json({ message: 'Unable to login.', error: error.message });
	}
});

router.get('/me', authenticateToken, async (req, res) => {
	try {
		const users = await readUsers();
		const user = users.find((candidate) => candidate.id === req.user.id);

		if (!user) {
			return res.status(404).json({ message: 'User not found.' });
		}

		return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email } });
	} catch (error) {
		return res.status(500).json({ message: 'Unable to fetch user profile.', error: error.message });
	}
});

module.exports = router;
