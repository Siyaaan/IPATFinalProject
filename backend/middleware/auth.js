const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'travel-bucketlist-dev-secret';

function authenticateToken(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (!token) {
		return res.status(401).json({ message: 'Missing authentication token.' });
	}

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload;
		return next();
	} catch {
		return res.status(401).json({ message: 'Invalid or expired token.' });
	}
}

module.exports = {
	authenticateToken,
	JWT_SECRET
};
