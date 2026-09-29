import 'dotenv/config';
import { SatelliteService } from '../services/satellite/satelliteService';

async function testRealNDVI() {
  console.log('🌍 Testing REAL Google Earth Engine NDVI...\n');

  const lat = 27.0238; // Rajasthan example
  const lon = 74.2179;

  console.log(`📍 Coordinates: ${lat}, ${lon}`);
  console.log(`🛰️ Provider: ${process.env.SATELLITE_PROVIDER}`);
  console.log(`🌎 Project: ${process.env.EARTH_ENGINE_PROJECT}\n`);

  try {
    const result = await SatelliteService.fetchNDVI(lat, lon);

    console.log('--- Earth Engine Response ---');
    console.dir(result, { depth: null });

    if (result.status === 'success') {
      console.log('\n✅ REAL NDVI SUCCESS');
      console.log(`🌱 NDVI: ${result.ndvi}`);
      console.log(`🌿 Vegetation: ${result.vegetationStatus}`);
      console.log(`📡 Source: ${result.source}`);
      console.log(`🛰️ Dataset: ${result.dataset}`);
      console.log(`🕒 Updated: ${result.lastUpdated}`);
      console.log(`📊 Trend: ${result.trendMonths.length} points`);
    } else {
      console.log(`\n❌ NDVI request did not succeed.`);
      console.log(`Status: ${result.status}`);
      console.log(`Message: ${result.message}`);
    }
  } catch (error) {
    console.error('\n❌ REAL NDVI TEST FAILED');
    console.error(error);
    process.exit(1);
  }
}

testRealNDVI();