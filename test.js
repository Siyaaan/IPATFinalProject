const http = require('http');

const API_BASE = 'http://localhost:3000';
let testToken = '';
let testUserId = '';
let testDestinationId = '';

function makeRequest(method, path, body = null, headers = {}) {
	return new Promise((resolve, reject) => {
		const url = new URL(API_BASE + path);
		const options = {
			hostname: url.hostname,
			port: url.port,
			path: url.pathname + url.search,
			method: method,
			headers: {
				'Content-Type': 'application/json',
				...headers
			}
		};

		const req = http.request(options, (res) => {
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('end', () => {
				try {
					const parsed = data ? JSON.parse(data) : {};
					resolve({ status: res.statusCode, data: parsed });
				} catch {
					resolve({ status: res.statusCode, data: data });
				}
			});
		});

		req.on('error', reject);
		if (body) {
			req.write(JSON.stringify(body));
		}
		req.end();
	});
}

async function runTests() {
	console.log('🧪 TRAVEL BUCKET LIST - COMPREHENSIVE TEST SUITE\n');
	console.log('=' .repeat(60));

	let passed = 0;
	let failed = 0;

	// Test 1: Health Check
	try {
		console.log('\n✓ TEST 1: Health Check');
		const res = await makeRequest('GET', '/health');
		if (res.status === 200 && res.data.ok === true) {
			console.log('  ✅ PASSED - Server is responding');
			passed++;
		} else {
			console.log('  ❌ FAILED - Unexpected response');
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 2: Register User
	try {
		console.log('\n✓ TEST 2: Register New User');
		const res = await makeRequest('POST', '/api/register', {
			name: 'Test User',
			email: 'test@example.com',
			password: 'testPass123'
		});
		if (res.status === 201) {
			console.log('  ✅ PASSED - User registered successfully');
			passed++;
		} else if (res.status === 400) {
			console.log('  ⚠️  User already exists (expected on 2nd run)');
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 3: Login User
	try {
		console.log('\n✓ TEST 3: Login User');
		const res = await makeRequest('POST', '/api/login', {
			email: 'test@example.com',
			password: 'testPass123'
		});
		if (res.status === 200 && res.data.token) {
			testToken = res.data.token;
			console.log('  ✅ PASSED - Login successful, token received');
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 4: Get User Profile
	try {
		console.log('\n✓ TEST 4: Get User Profile (Authenticated)');
		const res = await makeRequest('GET', '/api/me', null, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 200 && res.data.user?.email) {
			testUserId = res.data.user.id;
			console.log(`  ✅ PASSED - Retrieved user: ${res.data.user.name} (${res.data.user.email})`);
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 5: Create Destination
	try {
		console.log('\n✓ TEST 5: Create Destination (POST)');
		const res = await makeRequest('POST', '/api/destinations', {
			country_name: 'France',
			country_code: 'FR',
			status: 'want_to_go',
			notes: 'Visit Paris and the Eiffel Tower'
		}, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 201 && res.data.destination?.id) {
			testDestinationId = res.data.destination.id;
			console.log(`  ✅ PASSED - Created destination: ${res.data.destination.country_name}`);
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 6: Get All Destinations
	try {
		console.log('\n✓ TEST 6: Get All User Destinations (GET)');
		const res = await makeRequest('GET', '/api/destinations', null, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 200 && Array.isArray(res.data.destinations)) {
			console.log(`  ✅ PASSED - Retrieved ${res.data.destinations.length} destination(s)`);
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 7: Get Single Destination
	try {
		console.log('\n✓ TEST 7: Get Single Destination (GET by ID)');
		const res = await makeRequest('GET', `/api/destinations/${testDestinationId}`, null, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 200 && res.data.destination?.id) {
			console.log(`  ✅ PASSED - Retrieved: ${res.data.destination.country_name}`);
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 8: Update Destination
	try {
		console.log('\n✓ TEST 8: Update Destination (PUT)');
		const res = await makeRequest('PUT', `/api/destinations/${testDestinationId}`, {
			country_name: 'France',
			country_code: 'FR',
			status: 'planned',
			notes: 'Trip planned for June 2025'
		}, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 200 && res.data.destination?.status === 'planned') {
			console.log(`  ✅ PASSED - Updated status to: ${res.data.destination.status}`);
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 9: Create Another Destination
	try {
		console.log('\n✓ TEST 9: Create Second Destination');
		const res = await makeRequest('POST', '/api/destinations', {
			country_name: 'Japan',
			country_code: 'JP',
			status: 'want_to_go',
			notes: 'Experience Japanese culture'
		}, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 201 && res.data.destination?.id) {
			console.log(`  ✅ PASSED - Created: ${res.data.destination.country_name}`);
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 10: Delete Destination
	try {
		console.log('\n✓ TEST 10: Delete Destination (DELETE)');
		const res = await makeRequest('DELETE', `/api/destinations/${testDestinationId}`, null, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 200) {
			console.log('  ✅ PASSED - Destination deleted successfully');
			passed++;
		} else {
			console.log(`  ❌ FAILED - Status ${res.status}: ${res.data.message}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 11: Verify Deletion
	try {
		console.log('\n✓ TEST 11: Verify Deletion (GET deleted destination)');
		const res = await makeRequest('GET', `/api/destinations/${testDestinationId}`, null, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 404) {
			console.log('  ✅ PASSED - Destination not found (correctly deleted)');
			passed++;
		} else {
			console.log(`  ❌ FAILED - Expected 404, got ${res.status}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 12: Auth Test - No Token
	try {
		console.log('\n✓ TEST 12: Auth Validation (Missing Token)');
		const res = await makeRequest('GET', '/api/destinations');
		if (res.status === 401) {
			console.log('  ✅ PASSED - Correctly rejected request without token');
			passed++;
		} else {
			console.log(`  ❌ FAILED - Expected 401, got ${res.status}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 13: Auth Test - Invalid Token
	try {
		console.log('\n✓ TEST 13: Auth Validation (Invalid Token)');
		const res = await makeRequest('GET', '/api/destinations', null, {
			Authorization: 'Bearer invalid-token-xyz'
		});
		if (res.status === 401) {
			console.log('  ✅ PASSED - Correctly rejected invalid token');
			passed++;
		} else {
			console.log(`  ❌ FAILED - Expected 401, got ${res.status}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 14: Validation - Duplicate Email
	try {
		console.log('\n✓ TEST 14: Email Validation (Duplicate Email)');
		const res = await makeRequest('POST', '/api/register', {
			name: 'Another User',
			email: 'test@example.com',
			password: 'anotherPass'
		});
		if (res.status === 400 && res.data.message.includes('Email')) {
			console.log('  ✅ PASSED - Correctly rejected duplicate email');
			passed++;
		} else {
			console.log(`  ❌ FAILED - Expected 400, got ${res.status}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Test 15: Validation - Invalid Status
	try {
		console.log('\n✓ TEST 15: Status Validation (Invalid Status)');
		const res = await makeRequest('POST', '/api/destinations', {
			country_name: 'Brazil',
			country_code: 'BR',
			status: 'invalid_status',
			notes: ''
		}, {
			Authorization: `Bearer ${testToken}`
		});
		if (res.status === 400) {
			console.log('  ✅ PASSED - Correctly rejected invalid status');
			passed++;
		} else {
			console.log(`  ❌ FAILED - Expected 400, got ${res.status}`);
			failed++;
		}
	} catch (err) {
		console.log(`  ❌ FAILED - ${err.message}`);
		failed++;
	}

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('\n📊 TEST RESULTS SUMMARY');
	console.log(`   ✅ Passed: ${passed}`);
	console.log(`   ❌ Failed: ${failed}`);
	console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
	console.log('\n' + '='.repeat(60));

	if (failed === 0) {
		console.log('\n🎉 ALL TESTS PASSED! Project is ready for submission.\n');
		process.exit(0);
	} else {
		console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.\n`);
		process.exit(1);
	}
}

runTests().catch((err) => {
	console.error('Test suite error:', err);
	process.exit(1);
});
