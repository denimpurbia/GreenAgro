import { SoilEngine } from '../services/soil/soilEngine';
import { RegenerativeEngine } from '../services/regenerative/regenerativeEngine';
import { GeminiService } from '../services/ai/geminiService';

async function testSuite() {
  console.log('--- Testing AgriN Deterministic & AI Engines ---');

  // 1. Test Soil Engine
  const soil = SoilEngine.calculate({ ph: 6.8, nitrogen: 42, phosphorus: 28, potassium: 35, organicCarbon: 0.72 });
  console.log(`✓ Soil Engine Score: ${soil.score}/100, Rating: ${soil.rating}, Limiting: ${soil.limitingFactor}`);
  if (soil.score !== 74) throw new Error(`Soil score mismatch: expected 74, got ${soil.score}`);

  // 2. Test Regenerative Engine
  const regen = RegenerativeEngine.calculate({
    soilScore: 74,
    irrigationType: 'Drip',
    hasDrip: true,
    cropRotationCycles: 1,
    ndvi: 0.78,
    organicPracticeAdopted: true,
  });
  console.log(`✓ Regenerative Score: ${regen.overallScore}/100, Label: ${regen.ratingLabel}`);
  if (regen.overallScore !== 73) throw new Error(`Regen score mismatch: expected 73, got ${regen.overallScore}`);

  // 3. Test Gemini Advisory Service (Demo fallback)
  const advice = await GeminiService.generateAdvisory(
    {
      farmName: 'Farm 1 - Green Fields',
      crop: 'Wheat',
      stage: 'Tillering',
      soilScore: 74,
      ndvi: 0.78,
      weatherToday: '28°C, Partly Cloudy',
      rainProbability: '20%',
    },
    'Should I irrigate today?',
    'en'
  );
  console.log(`✓ Gemini Advisory generated: "${advice.slice(0, 80)}..."`);

  console.log('--- All Engine Tests Passed Successfully! ---');
}

testSuite().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
