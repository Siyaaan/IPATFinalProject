(() => {
	const API_BASE = '/api';
	const TOKEN_KEY = 'token';
	const COUNTRIES_BASE = 'https://restcountries.com/v3.1';
	let currentDestination = null;
	let currentCountry = null;

	function setMessage(message, isError = false) {
		const el = document.getElementById('detailMessage');
		if (!el) {
			return;
		}
		el.textContent = message;
		el.style.color = isError ? '#b91c1c' : '#0f766e';
	}

	function setLoading(message = '') {
		const el = document.getElementById('detailLoading');
		if (!el) {
			return;
		}
		el.textContent = message;
	}

	function getQueryParam(name) {
		const params = new URLSearchParams(window.location.search);
		return params.get(name);
	}

	function extractLanguages(country) {
		return Object.values(country?.languages || {}).join(', ') || 'N/A';
	}

	function extractCurrencies(country) {
		const currencies = Object.values(country?.currencies || {});
		if (!currencies.length) {
			return 'N/A';
		}
		return currencies.map((item) => `${item.name || ''} (${item.symbol || ''})`).join(', ');
	}

	async function fetchCountryByCodeOrName(code, name) {
		const endpoint = name
			? `${COUNTRIES_BASE}/name/${encodeURIComponent(name)}?fullText=true`
			: `${COUNTRIES_BASE}/alpha/${encodeURIComponent(code)}`;
		const response = await fetch(endpoint);
		if (!response.ok) {
			throw new Error('Unable to load country details.');
		}

		const payload = await response.json();
		return Array.isArray(payload) ? payload[0] : payload;
	}

	async function fetchDestinationById(id) {
		const token = localStorage.getItem(TOKEN_KEY);
		const response = await fetch(`${API_BASE}/destinations/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.message || 'Unable to load destination.');
		}

		return payload.destination;
	}

	function renderCountryDetail(country) {
		const card = document.getElementById('countryDetailCard');
		if (!card) {
			return;
		}

		const capital = country?.capital?.[0] || 'N/A';
		card.innerHTML = `
			<div class="detail-header">
				<img class="country-flag" src="${country?.flags?.png || ''}" alt="${country?.name?.common || 'Country'} flag" />
				<div>
					<h2>${country?.name?.official || country?.name?.common || 'Unknown country'}</h2>
					<p>${country?.name?.common || ''}</p>
				</div>
			</div>
			<ul class="detail-list">
				<li><strong>Capital:</strong> ${capital}</li>
				<li><strong>Region:</strong> ${country?.region || 'N/A'} / ${country?.subregion || 'N/A'}</li>
				<li><strong>Population:</strong> ${(country?.population || 0).toLocaleString()}</li>
				<li><strong>Languages:</strong> ${extractLanguages(country)}</li>
				<li><strong>Currencies:</strong> ${extractCurrencies(country)}</li>
				<li><strong>Timezones:</strong> ${(country?.timezones || []).join(', ') || 'N/A'}</li>
			</ul>
		`;
	}

	async function saveDestination(statusOverride) {
		if (!currentCountry) {
			setMessage('Country data not ready.', true);
			return;
		}

		const token = localStorage.getItem(TOKEN_KEY);
		const status = statusOverride || document.getElementById('statusInput')?.value;
		const notes = document.getElementById('notesInput')?.value || '';

		const method = currentDestination ? 'PUT' : 'POST';
		const endpoint = currentDestination ? `${API_BASE}/destinations/${currentDestination.id}` : `${API_BASE}/destinations`;

		const response = await fetch(endpoint, {
			method,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				country_name: currentCountry?.name?.common,
				country_code: currentCountry?.cca2,
				status,
				notes
			})
		});

		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.message || 'Unable to save destination.');
		}

		currentDestination = payload.destination;
		document.getElementById('statusInput').value = currentDestination.status;
		setMessage('Destination saved successfully.');
	}

	async function initDetailPage() {
		setLoading('Loading destination details...');
		setMessage('');
		try {
			const destinationId = getQueryParam('id');
			const countryCode = getQueryParam('code');

			if (destinationId) {
				currentDestination = await fetchDestinationById(destinationId);
				currentCountry = await fetchCountryByCodeOrName(currentDestination.country_code, currentDestination.country_name);
				document.getElementById('statusInput').value = currentDestination.status;
				document.getElementById('notesInput').value = currentDestination.notes || '';
			} else if (countryCode) {
				currentCountry = await fetchCountryByCodeOrName(countryCode, '');
			} else {
				throw new Error('Missing destination id or country code in URL.');
			}

			renderCountryDetail(currentCountry);
		} catch (error) {
			setMessage(error.message, true);
		} finally {
			setLoading('');
		}

		document.getElementById('destinationForm')?.addEventListener('submit', async (event) => {
			event.preventDefault();
			try {
				await saveDestination();
			} catch (error) {
				setMessage(error.message, true);
			}
		});

		document.getElementById('markVisitedBtn')?.addEventListener('click', async () => {
			try {
				await saveDestination('visited');
			} catch (error) {
				setMessage(error.message, true);
			}
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initDetailPage);
	} else {
		initDetailPage();
	}
})();
