(() => {
	const API_BASE = '/api';
	const TOKEN_KEY = 'token';
	let entries = [];

	function setMessage(message, isError = false) {
		const el = document.getElementById('bucketMessage');
		if (!el) {
			return;
		}

		el.textContent = message;
		el.style.color = isError ? '#b91c1c' : '#0f766e';
	}

	function setLoading(message = '') {
		const el = document.getElementById('bucketLoading');
		if (!el) {
			return;
		}

		el.textContent = message;
	}

	function getStatusLabel(status) {
		if (status === 'want_to_go') return 'Want to go';
		if (status === 'planned') return 'Planned';
		if (status === 'visited') return 'Visited';
		return status;
	}

	function getTagClass(status) {
		if (status === 'visited') return 'visited';
		if (status === 'planned') return 'booked';
		return 'planned';
	}

	async function fetchDestinations() {
		const token = localStorage.getItem(TOKEN_KEY);
		const response = await fetch(`${API_BASE}/destinations`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		const payload = await response.json();

		if (!response.ok) {
			throw new Error(payload.message || 'Failed to load destinations.');
		}

		return payload.destinations || [];
	}

	async function deleteDestination(id) {
		const token = localStorage.getItem(TOKEN_KEY);
		const response = await fetch(`${API_BASE}/destinations/${id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});
		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.message || 'Failed to delete destination.');
		}
	}

	async function updateDestination(item) {
		const token = localStorage.getItem(TOKEN_KEY);
		const response = await fetch(`${API_BASE}/destinations/${item.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				country_name: item.country_name,
				country_code: item.country_code,
				status: item.status,
				notes: item.notes || ''
			})
		});

		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.message || 'Failed to update destination.');
		}
	}

	function renderRows() {
		const tbody = document.getElementById('bucketTableBody');
		if (!tbody) {
			return;
		}

		const selectedStatus = document.getElementById('statusFilter')?.value || '';
		const filtered = selectedStatus ? entries.filter((entry) => entry.status === selectedStatus) : entries;
		tbody.innerHTML = '';

		if (!filtered.length) {
			tbody.innerHTML = '<tr><td colspan="4">No destinations found.</td></tr>';
			return;
		}

		filtered.forEach((item) => {
			const row = document.createElement('tr');
			row.innerHTML = `
				<td>
					<div class="country-row">
						<img class="country-flag-small" src="https://flagcdn.com/w80/${String(item.country_code).toLowerCase()}.png" alt="${item.country_name} flag" />
						<span>${item.country_name}</span>
					</div>
				</td>
				<td><span class="tag ${getTagClass(item.status)}">${getStatusLabel(item.status)}</span></td>
				<td>${item.notes ? item.notes.slice(0, 90) : 'No notes yet.'}</td>
				<td>
					<a class="btn btn-small" href="destination.html?id=${item.id}">Edit</a>
					<button class="btn btn-small" data-action="delete" type="button">Delete</button>
				</td>
			`;

			row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
				try {
					await deleteDestination(item.id);
					entries = entries.filter((entry) => entry.id !== item.id);
					renderRows();
					setMessage('Destination removed.');
				} catch (error) {
					setMessage(error.message, true);
				}
			});

			tbody.appendChild(row);
		});
	}

	async function clearVisited() {
		const visited = entries.filter((entry) => entry.status === 'visited');
		for (const item of visited) {
			await deleteDestination(item.id);
		}
		entries = entries.filter((entry) => entry.status !== 'visited');
		renderRows();
		setMessage('Visited destinations cleared.');
	}

	async function loadEntries() {
		setLoading('Loading bucket list...');
		setMessage('');
		try {
			entries = await fetchDestinations();
			renderRows();
		} catch (error) {
			setMessage(error.message, true);
		} finally {
			setLoading('');
		}
	}

	function initBucketList() {
		document.getElementById('statusFilter')?.addEventListener('change', renderRows);
		document.getElementById('clearVisitedBtn')?.addEventListener('click', async () => {
			try {
				await clearVisited();
			} catch (error) {
				setMessage(error.message, true);
			}
		});

		loadEntries();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initBucketList);
	} else {
		initBucketList();
	}
})();
