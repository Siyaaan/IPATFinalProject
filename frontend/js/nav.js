(() => {
	const TOKEN_KEY = 'token';

	function getToken() {
		return localStorage.getItem(TOKEN_KEY);
	}

	function clearAuth() {
		localStorage.removeItem(TOKEN_KEY);
	}

	function enforceProtectedPage() {
		const isProtected = document.body?.dataset?.protected === 'true';
		if (isProtected && !getToken()) {
			window.location.href = 'login.html';
		}
	}

	function ensureLogoutLink(nav) {
		let logoutLink = nav.querySelector('#logoutLink');
		if (!logoutLink) {
			logoutLink = document.createElement('a');
			logoutLink.id = 'logoutLink';
			logoutLink.href = '#';
			logoutLink.className = 'logout-link';
			logoutLink.textContent = 'Logout';
			nav.appendChild(logoutLink);
		}

		logoutLink.onclick = (event) => {
			event.preventDefault();
			clearAuth();
			window.location.href = 'login.html';
		};

		return logoutLink;
	}

	function updateNavAuthState() {
		const nav = document.querySelector('.site-nav');
		if (!nav) {
			return;
		}

		const token = getToken();
		const loginLink = nav.querySelector('a[href="login.html"]');
		const registerLink = nav.querySelector('a[href="register.html"]');
		const logoutLink = ensureLogoutLink(nav);

		if (token) {
			if (loginLink) loginLink.style.display = 'none';
			if (registerLink) registerLink.style.display = 'none';
			logoutLink.style.display = 'inline-block';
		} else {
			if (loginLink) loginLink.style.display = 'inline-block';
			if (registerLink) registerLink.style.display = 'inline-block';
			logoutLink.style.display = 'none';
		}
	}

	function initNav() {
		enforceProtectedPage();
		updateNavAuthState();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initNav);
	} else {
		initNav();
	}
})();
