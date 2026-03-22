(() => {
	const API_BASE = '/api';
	const TOKEN_KEY = 'token';

	function setCount(id, value) {
		const element = document.getElementById(id);
		if (element) {
			element.textContent = String(value);
		}
	}

	function setDashboardMessage(message, isError = false) {
		const messageEl = document.getElementById('dashboardMessage');
		if (!messageEl) {
			return;
		}

		messageEl.textContent = message;
		messageEl.style.color = isError ? '#b91c1c' : '#64748b';
	}

	async function fetchDestinations() {
		const token = localStorage.getItem(TOKEN_KEY);
		const response = await fetch(`${API_BASE}/destinations`, {
			headers: { Authorization: `Bearer ${token}` }
		});

		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.message || 'Unable to load destinations.');
		}

		return payload.destinations || [];
	}

	function renderRecent(destinations) {
		const list = document.getElementById('recentList');
		if (!list) {
			return;
		}

		list.innerHTML = '';
		const recent = [...destinations]
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.slice(0, 4);

		if (!recent.length) {
			list.innerHTML = '<p class="subtitle">No destinations yet. Add one from Browse page.</p>';
			return;
		}

		recent.forEach((item) => {
			const card = document.createElement('article');
			card.className = 'destination-card';
			card.innerHTML = `
				<h4>${item.country_name}</h4>
				<p>Status: ${item.status.replaceAll('_', ' ')}</p>
				<p>${item.notes ? item.notes.slice(0, 90) : 'No notes yet.'}</p>
			`;
			list.appendChild(card);
		});
	}

	async function initDashboard() {
		setDashboardMessage('Loading dashboard...');
		try {
			const destinations = await fetchDestinations();
			setCount('savedCount', destinations.length);
			setCount('visitedCount', destinations.filter((item) => item.status === 'visited').length);
			setCount('wantToGoCount', destinations.filter((item) => item.status === 'want_to_go').length);
			setCount('plannedCount', destinations.filter((item) => item.status === 'planned').length);
			renderRecent(destinations);
			setDashboardMessage('');
		} catch (error) {
			setDashboardMessage(error.message, true);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initDashboard);
	} else {
		initDashboard();
	}
})();
