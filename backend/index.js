const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const destinationRoutes = require('./routes/destinations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/health', (req, res) => {
	res.status(200).json({ ok: true });
});

app.use('/api', authRoutes);
app.use('/api', destinationRoutes);

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'frontend', 'dashboard.html'));
});

app.listen(PORT, () => {
	console.log(`Travel Bucket List server running on http://localhost:${PORT}`);
});
