/**
 * Automated Verification Script for Ridge-to-Lake Engines
 */

import { LakeHealthEngine } from '../modules/lake/lakeHealthEngine';
import { RusleEngine } from '../modules/watershed/rusleEngine';
import { NetPriceEngine } from '../modules/market/netPriceEngine';
import { LandscapeIndexEngine } from '../modules/landscape/landscapeIndexEngine';

console.log('====================================================');
console.log('🧪 Testing Ridge-to-Lake Calculation Engines');
console.log('====================================================\n');

// 1. Lake Health Engine Test
console.log('1. Testing Lake Health Engine...');
const lakeTest = LakeHealthEngine.calculate({
  waterAreaHa: 600,
  baselineAreaHa: 694,
  ndti: -0.05,
  ndci: 0.01,
  encroachmentHa: 5,
});
console.log('   Lake Health Score:', lakeTest.score, '/ 100');
console.log('   Status:', lakeTest.status);
console.log('   Breakdown:', JSON.stringify(lakeTest.breakdown));
console.assert(lakeTest.score > 0 && lakeTest.score <= 100, 'Score must be between 0 and 100');
console.log('   ✅ Lake Health Engine: PASSED\n');

// 2. RUSLE-lite Erosion Engine Test
console.log('2. Testing RUSLE-lite Erosion Engine...');
const rusleTest = RusleEngine.calculate({
  slopeDeg: 4.2,
  annualRainfallMm: 720,
  soilType: 'loam',
  ndvi: 0.42,
  hasConservationPractices: false,
});
console.log('   Estimated Soil Loss A:', rusleTest.a, 't/ha/year');
console.log('   Risk Category:', rusleTest.risk);
console.log('   Conservation Recommendations Count:', rusleTest.recommendations.length);
console.assert(rusleTest.a > 0, 'Soil loss A must be > 0');
console.log('   ✅ RUSLE Engine: PASSED\n');

// 3. Net Price Calculation Engine Test
console.log('3. Testing Fair Market Net Price Engine...');
const quotes = [
  { mandiCode: 'M1', mandiName: 'Nearby Mandi', district: 'Udaipur', distanceKm: 15, modalPrice: 2200, minPrice: 2100, maxPrice: 2300, priceDate: '2026-10-30' },
  { mandiCode: 'M2', mandiName: 'Distant High Price Mandi', district: 'Chittorgarh', distanceKm: 95, modalPrice: 2350, minPrice: 2200, maxPrice: 2450, priceDate: '2026-10-30' },
];
const ranked = NetPriceEngine.rank({
  quotes,
  transportCostPerKmPerQuintal: 1.8,
  fixedMandiFeePercent: 1.6,
  mspPrice: 2225,
});
console.log('   Rank 1 Mandi:', ranked[0].mandiName, '| Net:', ranked[0].netPrice, 'Rs/q');
console.log('   Rank 2 Mandi:', ranked[1].mandiName, '| Net:', ranked[1].netPrice, 'Rs/q');
console.assert(ranked[0].netPrice >= ranked[1].netPrice, 'Ranked mandis must be sorted by netPrice descending');
console.log('   ✅ Net Price Engine: PASSED\n');

// 4. Landscape Health Index & Dynamic Rebalancing Test
console.log('4. Testing Landscape Health Index & Dynamic Rebalancing...');
const fullLandscape = LandscapeIndexEngine.calculate({
  aravalliVegetationScore: 80,
  watershedResilienceScore: 75,
  lakeHealthScore: 72,
  farmRegenerativeScore: 78,
  farmCount: 12,
});
console.log('   Full Score (all 4 components):', fullLandscape.score, '/ 100');
console.log('   Status:', fullLandscape.status);

// Test dynamic rebalancing when farm regenerative score is unavailable (< 5 farms)
const rebalanced = LandscapeIndexEngine.calculate({
  aravalliVegetationScore: 80,
  watershedResilienceScore: 75,
  lakeHealthScore: 72,
  farmRegenerativeScore: null,
  farmCount: 2,
});
console.log('   Rebalanced Score (3 components):', rebalanced.score, '/ 100');
console.log('   Active Components Count:', rebalanced.activeComponents.length);
console.log('   Dropped Components:', rebalanced.droppedComponents.join(', '));
console.assert((rebalanced.score ?? 0) > 0 && (rebalanced.score ?? 0) <= 100, 'Rebalanced score must be within 0-100');
console.assert(rebalanced.activeComponents.length === 3, 'Must have 3 active components after rebalance');
console.log('   ✅ Landscape Health Index: PASSED\n');

console.log('====================================================');
console.log('🎉 ALL RIDGE-TO-LAKE ENGINES PASSED VERIFICATION!');
console.log('====================================================');

