/**
 * GeminiService — Crop Identification & Disease Diagnosis Gate Tests
 * Run with:  npx tsx src/scripts/test-crop-validation.ts
 */

// ─── Inline replica of the server-side validation logic ─────────────────────
type CropIdentificationStatus = 'identified' | 'uncertain' | 'unknown' | 'not_a_crop_leaf';

interface ValidationResult {
  identifiedCrop: string;
  cropIdentificationStatus: CropIdentificationStatus;
  cropIsUnknown: boolean;
  diseaseName: string;
  confidence: string;
  confidenceScore: number;
}

function runValidation(parsed: any): ValidationResult {
  const rawCrop = String(parsed.crop || '').trim();
  let cropConfidenceRaw = typeof parsed.cropConfidence === 'number' && !isNaN(parsed.cropConfidence)
    ? parsed.cropConfidence
    : Number(parsed.cropConfidence);
  if (isNaN(cropConfidenceRaw) || cropConfidenceRaw < 0) {
    cropConfidenceRaw = 0;
  } else if (cropConfidenceRaw > 100) {
    cropConfidenceRaw = 100;
  }

  const rawCropLower = rawCrop.toLowerCase();

  let identifiedCrop: string;
  let cropIdentificationStatus: CropIdentificationStatus;

  const isNonPlantOrNonCrop =
    rawCropLower === 'not a crop leaf' ||
    rawCropLower === 'not_a_crop_leaf' ||
    rawCropLower === 'not a plant' ||
    rawCropLower === 'not a leaf' ||
    rawCropLower === 'non-agricultural' ||
    rawCropLower === 'non agricultural' ||
    rawCropLower.includes('not a crop') ||
    rawCropLower.includes('not a plant');

  const isUnknownName =
    rawCropLower === '' ||
    rawCropLower === 'unknown' ||
    rawCropLower.includes('unknown') ||
    rawCropLower.includes('unidentif') ||
    rawCropLower === 'n/a';

  if (isNonPlantOrNonCrop) {
    identifiedCrop = 'Unknown';
    cropIdentificationStatus = 'not_a_crop_leaf';
  } else if (isUnknownName || cropConfidenceRaw < 50) {
    identifiedCrop = 'Unknown';
    cropIdentificationStatus = 'unknown';
  } else if (cropConfidenceRaw < 70) {
    identifiedCrop = rawCrop;
    cropIdentificationStatus = 'uncertain';
  } else {
    identifiedCrop = rawCrop;
    cropIdentificationStatus = 'identified';
  }

  const cropIsUnknown =
    cropIdentificationStatus === 'unknown' ||
    cropIdentificationStatus === 'not_a_crop_leaf' ||
    cropIdentificationStatus === 'uncertain';

  return {
    identifiedCrop,
    cropIdentificationStatus,
    cropIsUnknown,
    diseaseName: cropIsUnknown ? 'Crop identification pending' : String(parsed.diseaseName || 'Unknown'),
    confidence: cropIsUnknown ? 'Low Confidence' : String(parsed.confidence || 'Low Confidence'),
    confidenceScore: cropIsUnknown ? 0 : Number(parsed.confidenceScore ?? 0),
  };
}

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function test(name: string, fn: () => void) {
  console.log(`\n🧪 ${name}`);
  fn();
}

// ─── TEST 1: Random tree leaf ─────────────────────────────────────────────────
test('TEST 1: Random tree leaf ⟶ Unknown crop, no disease diagnosis', () => {
  const r = runValidation({ crop: 'Unknown', cropConfidence: 0, diseaseName: 'Healthy', confidenceScore: 95 });
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
  assert('status = unknown', r.cropIdentificationStatus === 'unknown');
  assert('cropIsUnknown = true', r.cropIsUnknown === true);
  assert('confidenceScore = 0 (NOT 95)', r.confidenceScore === 0, `got ${r.confidenceScore}`);
  assert('confidence = Low Confidence', r.confidence === 'Low Confidence');
  assert('diseaseName not millet/wheat/rice', !/millet|wheat|rice|tomato/i.test(r.diseaseName));
});

// ─── TEST 2: Clearly identifiable wheat leaf ──────────────────────────────────
test('TEST 2: Clearly identifiable wheat leaf ⟶ crop=Wheat, diagnosis trusted', () => {
  const r = runValidation({ crop: 'Wheat', cropConfidence: 85, diseaseName: 'Wheat Rust', confidence: 'High Confidence', confidenceScore: 82 });
  assert('identifiedCrop = Wheat', r.identifiedCrop === 'Wheat');
  assert('status = identified', r.cropIdentificationStatus === 'identified');
  assert('cropIsUnknown = false', r.cropIsUnknown === false);
  assert('diseaseName = Wheat Rust', r.diseaseName === 'Wheat Rust');
  assert('confidenceScore = 82', r.confidenceScore === 82);
});

// ─── TEST 3: Clearly identifiable tomato leaf ─────────────────────────────────
test('TEST 3: Clearly identifiable tomato leaf ⟶ crop=Tomato, diagnosis trusted', () => {
  const r = runValidation({ crop: 'Tomato', cropConfidence: 91, diseaseName: 'Early Blight', confidence: 'High Confidence', confidenceScore: 88 });
  assert('identifiedCrop = Tomato', r.identifiedCrop === 'Tomato');
  assert('status = identified', r.cropIdentificationStatus === 'identified');
  assert('cropIsUnknown = false', r.cropIsUnknown === false);
  assert('diseaseName = Early Blight', r.diseaseName === 'Early Blight');
  assert('confidenceScore = 88', r.confidenceScore === 88);
});

// ─── TEST 4: Blurry/unusable image ───────────────────────────────────────────
test('TEST 4: Blurry/unusable image ⟶ Unknown, unable to analyze', () => {
  const r = runValidation({ crop: 'Unknown', cropConfidence: 0, diseaseName: 'Unable to reliably diagnose', confidenceScore: 0 });
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
  assert('status = unknown', r.cropIdentificationStatus === 'unknown');
  assert('cropIsUnknown = true', r.cropIsUnknown === true);
  assert('confidenceScore = 0', r.confidenceScore === 0);
  assert('confidence = Low Confidence', r.confidence === 'Low Confidence');
});

// ─── TEST 5: Non-plant image ──────────────────────────────────────────────────
test('TEST 5: Non-plant image ⟶ not_a_crop_leaf, no diagnosis', () => {
  const r = runValidation({ crop: 'Not a crop leaf', cropConfidence: 0, diseaseName: 'N/A', confidenceScore: 0 });
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
  assert('status = not_a_crop_leaf', r.cropIdentificationStatus === 'not_a_crop_leaf');
  assert('cropIsUnknown = true', r.cropIsUnknown === true);
  assert('confidenceScore = 0', r.confidenceScore === 0);
});

// ─── TEST 6: User hint=millet, image=wheat ─────────────────────────────────────
test('TEST 6: User hint=millet, image=wheat ⟶ returns Wheat, NOT millet', () => {
  // The user-supplied cropName is NEVER fed into validation — only parsed model output
  const r = runValidation({ crop: 'Wheat', cropConfidence: 80, diseaseName: 'Healthy', confidenceScore: 78 });
  assert('identifiedCrop = Wheat (not millet)', r.identifiedCrop === 'Wheat');
  assert('identifiedCrop does not contain millet', !/millet/i.test(r.identifiedCrop));
  assert('status = identified', r.cropIdentificationStatus === 'identified');
  assert('cropIsUnknown = false', r.cropIsUnknown === false);
});

// ─── TEST 7: User hint=millet, image=random tree ──────────────────────────────
test('TEST 7: User hint=millet, image=random tree ⟶ Unknown, no disease diagnosis', () => {
  const r = runValidation({ crop: 'Unknown', cropConfidence: 0, diseaseName: 'Unable to reliably diagnose', confidenceScore: 0 });
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
  assert('identifiedCrop not millet', !/millet/i.test(r.identifiedCrop));
  assert('status = unknown', r.cropIdentificationStatus === 'unknown');
  assert('cropIsUnknown = true', r.cropIsUnknown === true);
  assert('confidenceScore = 0', r.confidenceScore === 0);
  assert('confidence = Low Confidence', r.confidence === 'Low Confidence');
  assert('diseaseName not millet/wheat/rice', !/millet|wheat|rice/i.test(r.diseaseName));
});

// ─── EDGE: model lies with 95% confidence for unknown crop ────────────────────
test('EDGE: Model returns 95% confidence for unknown crop ⟶ gate overrides to 0', () => {
  const r = runValidation({ crop: 'Unknown', cropConfidence: 0, diseaseName: 'Healthy', confidence: 'High Confidence', confidenceScore: 95 });
  assert('confidenceScore overridden to 0', r.confidenceScore === 0, `got ${r.confidenceScore}`);
  assert('confidence = Low Confidence', r.confidence === 'Low Confidence');
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
});

// ─── EDGE: borderline 60% confidence ─────────────────────────────────────────
test('EDGE: cropConfidence=60 ⟶ uncertain, diagnosis gated', () => {
  const r = runValidation({ crop: 'Rice', cropConfidence: 60, diseaseName: 'Blast Disease', confidence: 'High Confidence', confidenceScore: 75 });
  assert('status = uncertain', r.cropIdentificationStatus === 'uncertain');
  assert('cropIsUnknown = true (gated)', r.cropIsUnknown === true);
  assert('confidenceScore = 0 (gated)', r.confidenceScore === 0, `got ${r.confidenceScore}`);
  assert('confidence = Low Confidence', r.confidence === 'Low Confidence');
});

// ─── EDGE: NaN or missing confidence ─────────────────────────────────────────
test('EDGE: cropConfidence is NaN/string ⟶ treated as 0, status unknown', () => {
  const r = runValidation({ crop: 'Rice', cropConfidence: 'not-a-number', diseaseName: 'Blast Disease', confidenceScore: 80 });
  assert('status = unknown', r.cropIdentificationStatus === 'unknown');
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
  assert('confidenceScore = 0 (gated)', r.confidenceScore === 0);
});

// ─── EDGE: Negative confidence ───────────────────────────────────────────────
test('EDGE: cropConfidence is negative ⟶ clamped to 0, status unknown', () => {
  const r = runValidation({ crop: 'Corn', cropConfidence: -20, diseaseName: 'Corn Smut', confidenceScore: 90 });
  assert('status = unknown', r.cropIdentificationStatus === 'unknown');
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
  assert('confidenceScore = 0 (gated)', r.confidenceScore === 0);
});

// ─── EDGE: Fuzzy unknown plant ───────────────────────────────────────────────
test('EDGE: crop is "Unknown Plant Species" with high confidence ⟶ unknown, gated', () => {
  const r = runValidation({ crop: 'Unknown Plant Species', cropConfidence: 95, diseaseName: 'Leaf Spot', confidenceScore: 90 });
  assert('status = unknown', r.cropIdentificationStatus === 'unknown');
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
  assert('confidenceScore = 0 (gated)', r.confidenceScore === 0);
});

// ─── EDGE: Fuzzy non-plant / non-crop ────────────────────────────────────────
test('EDGE: crop contains "not a crop" ⟶ not_a_crop_leaf, gated', () => {
  const r = runValidation({ crop: 'This is not a crop leaf', cropConfidence: 90, diseaseName: 'N/A', confidenceScore: 90 });
  assert('status = not_a_crop_leaf', r.cropIdentificationStatus === 'not_a_crop_leaf');
  assert('identifiedCrop = Unknown', r.identifiedCrop === 'Unknown');
  assert('confidenceScore = 0 (gated)', r.confidenceScore === 0);
});

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
if (failed === 0) {
  console.log('✅ ALL TESTS PASSED');
  process.exit(0);
} else {
  console.error(`❌ ${failed} TEST(S) FAILED`);
  process.exit(1);
}
