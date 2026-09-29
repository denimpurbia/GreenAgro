/**
 * Verification test for GreenAgro Real Agricultural Data Migration
 */
async function runVerification() {
  const BASE = 'http://localhost:5000/api';

  console.log('🚀 Starting GreenAgro Real Agricultural Data Verification...\n');

  // ============================================================
  // 1. Health Check
  // ============================================================
  console.log('1. Testing GET /api/health...');

  const healthRes = await fetch(`${BASE}/health`);
  const health = await healthRes.json();

  console.log(
    '   Status:',
    health.status,
    '| Database:',
    health.database,
    '| Satellite:',
    health.services.satellite
  );

  if (health.database !== 'mongodb') {
    throw new Error('Database is not mongodb');
  }

  if (health.services.satellite !== 'earth-engine') {
    throw new Error('Satellite provider is not configured as earth-engine');
  }

  console.log('   ✓ MongoDB Atlas connected.');
  console.log('   ✓ Google Earth Engine configured.');

  // ============================================================
  // 2. Register new user
  // ============================================================
  const email = `farmer_${Date.now()}@agrin.test`;

  console.log(`\n2. Registering new farmer: ${email}...`);

  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Sunita Sharma',
      email,
      password: 'RealPassword123!',
      role: 'farmer',
      location: 'Nagaur, Rajasthan',
    }),
  });

  const regData = await regRes.json();

  if (regRes.status !== 201 || !regData.token) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }

  const token = regData.token;

  console.log('   ✓ Registered successfully. Token received.');

  // ============================================================
  // 3. GET /api/farms/me — MUST be null for new user
  // ============================================================
  console.log(
    '\n3. Testing GET /api/farms/me for new user (Expect farm: null)...'
  );

  const farmMeRes = await fetch(`${BASE}/farms/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const farmMeData = await farmMeRes.json();

  console.log('   Farm returned:', farmMeData.farm);

  if (farmMeData.farm !== null) {
    throw new Error(
      `Expected farm to be null, but got: ${JSON.stringify(farmMeData.farm)}`
    );
  }

  console.log('   ✓ Verified: No automatic fake farm created.');

  // ============================================================
  // 4. Create Farm
  // ============================================================
  console.log('\n4. Creating real farm plot via POST /api/farms...');

  const createFarmRes = await fetch(`${BASE}/farms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Surya Agro Field',
      locationName: 'Nagaur, Rajasthan',
      state: 'Rajasthan',
      country: 'India',
      latitude: 27.2038,
      longitude: 73.7438,
      areaAcres: 6.5,
      primaryCrop: 'Pearl Millet (Bajra)',
      soilType: 'Sandy Loam',
      irrigationMethod: 'Drip',
    }),
  });

  const createFarmData = await createFarmRes.json();

  if (createFarmRes.status !== 201 || !createFarmData.farm) {
    throw new Error(
      `Farm creation failed: ${JSON.stringify(createFarmData)}`
    );
  }

  const farmId = createFarmData.farm.id;

  console.log(
    '   ✓ Farm created:',
    createFarmData.farm.name,
    '| Acres:',
    createFarmData.farm.areaAcres,
    '| ID:',
    farmId
  );

  // ============================================================
  // 5. GET /api/farms/me — Now returns created farm
  // ============================================================
  console.log(
    '\n5. Verifying GET /api/farms/me returns created farm...'
  );

  const verifyFarmRes = await fetch(`${BASE}/farms/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const verifyFarmData = await verifyFarmRes.json();

  if (
    !verifyFarmData.farm ||
    verifyFarmData.farm.name !== 'Surya Agro Field'
  ) {
    throw new Error('Farm verification mismatch');
  }

  console.log(
    '   ✓ Verified: Farm retrieved successfully from MongoDB Atlas.'
  );

  // ============================================================
  // 6. Real Weather via Open-Meteo
  // ============================================================
  console.log(
    '\n6. Testing GET /api/weather with user farm coordinates (27.2038, 73.7438)...'
  );

  const weatherRes = await fetch(
    `${BASE}/weather?lat=27.2038&lon=73.7438&location=Nagaur`
  );

  const weatherData = await weatherRes.json();

  if (
    weatherData.status !== 'success' ||
    !weatherData.current
  ) {
    throw new Error(
      `Weather fetch failed: ${JSON.stringify(weatherData)}`
    );
  }

  console.log(
    '   ✓ Real Live Weather:',
    weatherData.location,
    '| Temp:',
    weatherData.current.temp + '°C',
    '| Humidity:',
    weatherData.current.humidity + '%',
    '| Rain Prob:',
    weatherData.current.rainProbability + '%'
  );

  // ============================================================
  // 7. Soil Calculation & MongoDB Persistence
  // ============================================================
  console.log(
    '\n7. Testing POST /api/soil and MongoDB persistence...'
  );

  const soilRes = await fetch(`${BASE}/soil`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ph: 6.4,
      nitrogen: 38,
      phosphorus: 28,
      potassium: 42,
      organicCarbon: 0.45,
      farmId,
    }),
  });

  const soilData = await soilRes.json();

  if (
    soilData.status !== 'success' ||
    soilData.score === undefined ||
    soilData.score === null
  ) {
    throw new Error(
      `Soil test failed: ${JSON.stringify(soilData)}`
    );
  }

  console.log(
    '   ✓ Dynamic Soil Score:',
    soilData.score + '/100',
    '| Rating:',
    soilData.rating
  );

  console.log(
    '   ✓ Limiting Factor:',
    soilData.limitingFactor
  );

  console.log(
    '   ✓ Dynamic Recommendations:',
    soilData.recommendations
  );

  // ============================================================
  // 8. GET /api/soil/latest
  // ============================================================
  console.log(
    '\n8. Testing GET /api/soil/latest from MongoDB Atlas...'
  );

  const latestSoilRes = await fetch(`${BASE}/soil/latest`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const latestSoilData = await latestSoilRes.json();

  if (
    !latestSoilData.observation ||
    latestSoilData.observation.score !== soilData.score
  ) {
    throw new Error(
      'Latest soil observation retrieval failed or score mismatch'
    );
  }

  console.log(
    '   ✓ Verified: Soil observation persisted in MongoDB with ID:',
    latestSoilData.observation._id
  );

  // ============================================================
  // 9. Regenerative Farming Engine
  // ============================================================
  console.log('\n9. Testing POST /api/regenerative...');

  const regenRes = await fetch(`${BASE}/regenerative`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      soilScore: soilData.score,
      irrigationType: 'Drip',
      hasDrip: true,
      cropRotationCycles: 2,

      // Regenerative engine can work without satellite data.
      // Real NDVI is verified separately in Step 11.
      ndvi: null,

      organicPracticeAdopted: false,
    }),
  });

  const regenData = await regenRes.json();

  if (
    regenData.status &&
    regenData.status !== 'success'
  ) {
    throw new Error(
      `Regenerative calculation failed: ${JSON.stringify(regenData)}`
    );
  }

  console.log(
    '   ✓ Deterministic Overall Score:',
    regenData.overallScore + '/100',
    '| Rating:',
    regenData.ratingLabel
  );

  console.log(
    '   ✓ Pillars:',
    regenData.pillars
      .map((p: any) => `${p.name}: ${p.score}`)
      .join(' | ')
  );

  console.log(
    '   ✓ Generated Recommendations Count:',
    regenData.keyRecommendations.length
  );

  // ============================================================
  // 10. BRICS Knowledge Exchange
  // ============================================================
  console.log(
    '\n10. Testing GET /api/knowledge and POST /api/knowledge/:id/like...'
  );

  const knowRes = await fetch(`${BASE}/knowledge`);
  const knowData = await knowRes.json();

  if (
    knowData.status !== 'success' ||
    !Array.isArray(knowData.practices) ||
    knowData.practices.length === 0
  ) {
    throw new Error('Knowledge practices empty or failed');
  }

  const practice = knowData.practices[0];
  const practiceId = practice.practiceId;
  const initialLikes = practice.likes;

  console.log(
    `   ✓ Found ${knowData.practices.length} BRICS practices in MongoDB.`
  );

  console.log(
    `   ✓ Testing like on "${practice.title}" (Current likes: ${initialLikes})...`
  );

  const likeRes = await fetch(
    `${BASE}/knowledge/${practiceId}/like`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const likeData = await likeRes.json();

  console.log('   ✓ Like Response:', likeData);

  if (likeData.likes !== initialLikes + 1) {
    throw new Error('Like count did not increment');
  }

  // ============================================================
  // 11. REAL Google Earth Engine Satellite / NDVI
  // ============================================================
  console.log(
    '\n11. Testing GET /api/satellite with REAL Google Earth Engine NDVI...'
  );

  const satRes = await fetch(
    `${BASE}/satellite?lat=27.2038&lon=73.7438`
  );

  const satData = await satRes.json();

  console.log(
    '   ✓ Satellite Response Status:',
    satData.status
  );

  if (satData.status !== 'success') {
    throw new Error(
      `Real satellite request failed: ${JSON.stringify(satData)}`
    );
  }

  // NDVI must be a real numeric value.
  if (
    typeof satData.ndvi !== 'number' ||
    !Number.isFinite(satData.ndvi)
  ) {
    throw new Error(
      `Satellite did not return a valid numeric NDVI: ${JSON.stringify(
        satData
      )}`
    );
  }

  // NDVI should be within the standard vegetation index range.
  if (satData.ndvi < -1 || satData.ndvi > 1) {
    throw new Error(
      `Invalid NDVI value received: ${satData.ndvi}`
    );
  }

  // Verify Google Earth Engine source.
  if (satData.source !== 'Google Earth Engine') {
    throw new Error(
      `Unexpected satellite source: ${satData.source}`
    );
  }

  // Verify Sentinel-2 dataset.
  if (
    satData.dataset !== 'COPERNICUS/S2_SR_HARMONIZED'
  ) {
    throw new Error(
      `Unexpected satellite dataset: ${satData.dataset}`
    );
  }

  // Verify live provenance.
  if (
    !satData.provenance ||
    satData.provenance.sourceType !== 'live'
  ) {
    throw new Error(
      'Satellite provenance does not indicate live data.'
    );
  }

  // Verify trend data.
  if (
    !Array.isArray(satData.trendMonths) ||
    satData.trendMonths.length === 0
  ) {
    throw new Error(
      'Satellite trend data is missing or empty.'
    );
  }

  console.log(
    '   ✓ REAL NDVI:',
    satData.ndvi
  );

  console.log(
    '   ✓ Vegetation:',
    satData.vegetationStatus
  );

  console.log(
    '   ✓ Source:',
    satData.source
  );

  console.log(
    '   ✓ Dataset:',
    satData.dataset
  );

  console.log(
    '   ✓ Provenance:',
    satData.provenance.source,
    '| Type:',
    satData.provenance.sourceType
  );

  console.log(
    '   ✓ Trend:',
    satData.trendMonths.length,
    'points'
  );

  console.log(
    '   ✓ Last Updated:',
    satData.lastUpdated
  );

  // ============================================================
  // 12. GreenAgro AI Assistant Authentication
  // ============================================================
  console.log(
    '\n12. Testing GreenAgro AI Assistant authentication enforcement...'
  );

  const unauthChatRes = await fetch(
    `${BASE}/assistant/message`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        farmContext: {},
      }),
    }
  );

  if (unauthChatRes.status !== 401) {
    throw new Error(
      `Expected 401 for unauthenticated chat, got ${unauthChatRes.status}`
    );
  }

  console.log(
    '   ✓ Unauthenticated AI chat correctly rejected with 401 Unauthorized.'
  );

  // ============================================================
  // FINAL RESULT
  // ============================================================
  console.log('\n====================================================');
  console.log('🎉 ALL 12 INTEGRATION & DATA PIPELINE TESTS PASSED!');
  console.log('====================================================\n');
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});