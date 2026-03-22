(() => {
	const API_BASE = '/api';
	const TOKEN_KEY = 'token';
	const COUNTRIES_BASE = 'https://restcountries.com/v3.1';

	function setMessage(message, isError = false) {
		const el = document.getElementById('browseMessage');
		if (!el) {
			return;
		}
		el.textContent = message;
		el.style.color = isError ? '#b91c1c' : '#0f766e';
	}

	function setLoading(message = '') {
		const el = document.getElementById('browseLoading');
		if (!el) {
			return;
		}
		el.textContent = message;
	}

	async function fetchCountries() {
		const region = document.getElementById('regionFilter')?.value?.trim();
		const search = document.getElementById('searchInput')?.value?.trim().toLowerCase() || '';

		const endpoint = region
			? `${COUNTRIES_BASE}/region/${encodeURIComponent(region)}?fields=name,flags,region,cca2`
			: `${COUNTRIES_BASE}/all?fields=name,flags,region,cca2`;

		const response = await fetch(endpoint);
		if (!response.ok) {
			throw new Error('Unable to fetch countries from REST Countries API.');
		}

		const countries = await response.json();
		return countries.filter((country) =>
			!search ? true : country?.name?.common?.toLowerCase().includes(search)
		);
	}

	async function addToBucketList(country) {
		const token = localStorage.getItem(TOKEN_KEY);
		if (!token) {
			setMessage('Please login first.', true);
			return;
		}

		const response = await fetch(`${API_BASE}/destinations`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				country_name: country?.name?.common,
				country_code: country?.cca2,
				status: 'want_to_go',
				notes: ''
			})
		});

		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.message || 'Failed to add destination.');
		}

		setMessage(`${country?.name?.common} added to your bucket list.`);
	}

	function renderCountries(countries) {
		const grid = document.getElementById('destinationsGrid');
		if (!grid) {
			return;
		}
		grid.innerHTML = '';

		if (!countries.length) {
			grid.innerHTML = '<p class="subtitle">No countries found.</p>';
			return;
		}

		countries.forEach((country) => {
			const card = document.createElement('article');
			card.className = 'destination-card';
			card.innerHTML = `
				<img class="country-flag" src="${country.flags?.png || ''}" alt="${country.name?.common || 'Country'} flag" />
				<h3>${country.name?.common || 'Unknown'}</h3>
				<p>Region: ${country.region || 'Unknown'}</p>
				<div class="card-actions">
					<button class="btn btn-primary" data-action="add" type="button">Add to Bucket List</button>
					<a class="btn btn-secondary" href="destination.html?code=${country.cca2}">View Details</a>
				</div>
			`;

			card.querySelector('[data-action="add"]')?.addEventListener('click', async () => {
				try {
					await addToBucketList(country);
				} catch (error) {
					setMessage(error.message, true);
				}
			});

			grid.appendChild(card);
		});
	}

	async function loadCountries() {
		setLoading('Loading countries...');
		setMessage('');
		try {
			const countries = await fetchCountries();
			renderCountries(countries);
		} catch (error) {
			setMessage(error.message, true);
		} finally {
			setLoading('');
		}
	}

	function initBrowse() {
		document.getElementById('searchInput')?.addEventListener('input', loadCountries);
		document.getElementById('regionFilter')?.addEventListener('change', loadCountries);
		loadCountries();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initBrowse);
	} else {
		initBrowse();
	}
})();
