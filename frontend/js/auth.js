(() => {
	const API_BASE = '/api';
	const TOKEN_KEY = 'token';

	function setAuthMessage(message, isError = false) {
		const messageEl = document.getElementById('authMessage');
		if (!messageEl) {
			return;
		}

		messageEl.textContent = message;
		messageEl.style.color = isError ? '#b91c1c' : '#0f766e';
	}

	function redirectIfLoggedIn() {
		const token = localStorage.getItem(TOKEN_KEY);
		if (token && (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html'))) {
			window.location.href = 'dashboard.html';
		}
	}

	async function handleLogin(event) {
		event.preventDefault();

		const email = document.getElementById('email')?.value?.trim();
		const password = document.getElementById('password')?.value;

		if (!email || !password) {
			setAuthMessage('Email and password are required.', true);
			return;
		}

		setAuthMessage('Logging in...');

		try {
			const response = await fetch(`${API_BASE}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const payload = await response.json();
			if (!response.ok) {
				setAuthMessage(payload.message || 'Login failed.', true);
				return;
			}

			localStorage.setItem(TOKEN_KEY, payload.token);
			setAuthMessage('Login successful. Redirecting...');
			window.setTimeout(() => {
				window.location.href = 'dashboard.html';
			}, 600);
		} catch {
			setAuthMessage('Unable to connect to server.', true);
		}
	}

	async function handleRegister(event) {
		event.preventDefault();

		const name = document.getElementById('name')?.value?.trim();
		const email = document.getElementById('email')?.value?.trim();
		const password = document.getElementById('password')?.value;

		if (!name || !email || !password) {
			setAuthMessage('All fields are required.', true);
			return;
		}

		setAuthMessage('Creating account...');

		try {
			const response = await fetch(`${API_BASE}/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, password })
			});

			const payload = await response.json();
			if (!response.ok) {
				setAuthMessage(payload.message || 'Registration failed.', true);
				return;
			}

			setAuthMessage('Registration successful. Redirecting to login...');
			window.setTimeout(() => {
				window.location.href = 'login.html';
			}, 700);
		} catch {
			setAuthMessage('Unable to connect to server.', true);
		}
	}

	function initAuthForms() {
		redirectIfLoggedIn();

		const loginForm = document.getElementById('loginForm');
		if (loginForm) {
			loginForm.addEventListener('submit', handleLogin);
		}

		const registerForm = document.getElementById('registerForm');
		if (registerForm) {
			registerForm.addEventListener('submit', handleRegister);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initAuthForms);
	} else {
		initAuthForms();
	}
})();
