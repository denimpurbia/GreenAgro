/**
 * Lake Health Score Engine
 *
 * Formula specified in specification:
 * - Water Area: 40% weight
 * - NDTI (Turbidity): 25% weight
 * - NDCI (Chlorophyll / Algal bloom): 25% weight
 * - Encroachment: 10% weight
 *
 * Total Score: 0 - 100
 *
 * NOTE: Satellite indicators are spectral proxies, NEVER laboratory water-quality tests.
 */

export interface LakeHealthInput {
  waterAreaHa: number;
  baselineAreaHa: number;
  ndti?: number; // Normalized Difference Turbidity Index (-1 to 1)
  ndci?: number; // Normalized Difference Chlorophyll Index (-1 to 1)
  encroachmentHa?: number;
}

export interface LakeHealthResult {
  score: number;
  status: 'critical' | 'poor' | 'moderate' | 'good' | 'pristine';
  breakdown: {
    waterAreaScore: number;
    ndtiScore: number;
    ndciScore: number;
    encroachmentScore: number;
  };
  weights: {
    waterArea: number;
    ndti: number;
    ndci: number;
    encroachment: number;
  };
  explanationEn: string;
  explanationHi: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class LakeHealthEngine {
  public static calculate(input: LakeHealthInput): LakeHealthResult {
    const { waterAreaHa, baselineAreaHa, ndti = 0.05, ndci = 0.02, encroachmentHa = 0 } = input;

    // 1. Water Area Score (40% weight): Compare to historical baseline
    // 100% if >= baseline, linearly drops as area shrinks
    const areaRatio = baselineAreaHa > 0 ? waterAreaHa / baselineAreaHa : 1.0;
    const waterAreaScore = clamp(Math.round(areaRatio * 100), 0, 100);

    // 2. NDTI Score (25% weight): Turbidity proxy
    // Clean/clear water typically has negative NDTI (-0.3 to 0.0). High sediment > 0.2
    // Map -0.2 -> 100, +0.3 -> 0
    const ndtiNorm = (ndti - -0.2) / 0.5; // 0 for clear, 1 for very turbid
    const ndtiScore = clamp(Math.round((1 - ndtiNorm) * 100), 0, 100);

    // 3. NDCI Score (25% weight): Chlorophyll/algal bloom proxy
    // Clear water NDCI < -0.05. Heavy bloom > 0.25
    // Map -0.05 -> 100, +0.25 -> 0
    const ndciNorm = (ndci - -0.05) / 0.3;
    const ndciScore = clamp(Math.round((1 - ndciNorm) * 100), 0, 100);

    // 4. Encroachment Score (10% weight):
    // 0 ha encroachment = 100, every 10 ha reduces score
    const encroachmentScore = clamp(Math.round(100 - encroachmentHa * 5), 0, 100);

    // Combined Weighted Score
    const weightedScore = Math.round(
      waterAreaScore * 0.4 +
      ndtiScore * 0.25 +
      ndciScore * 0.25 +
      encroachmentScore * 0.1
    );

    const score = clamp(weightedScore, 0, 100);

    let status: LakeHealthResult['status'] = 'moderate';
    if (score >= 85) status = 'pristine';
    else if (score >= 70) status = 'good';
    else if (score >= 50) status = 'moderate';
    else if (score >= 35) status = 'poor';
    else status = 'critical';

    const explanationEn = `Lake Health Index is ${score}/100 (${status}). Water spread is at ${Math.round(
      areaRatio * 100
    )}% of historical baseline. Turbidity score: ${ndtiScore}/100. Algae/chlorophyll proxy score: ${ndciScore}/100.`;

    const explanationHi = `झील स्वास्थ्य सूचकांक ${score}/100 (${status}) है। जल फैलाव ऐतिहासिक बेसलाइन का ${Math.round(
      areaRatio * 100
    )}% है। मैलापन (टर्बिडिटी) स्कोर: ${ndtiScore}/100। काई/शैवाल स्कोर: ${ndciScore}/100।`;

    return {
      score,
      status,
      breakdown: {
        waterAreaScore,
        ndtiScore,
        ndciScore,
        encroachmentScore,
      },
      weights: {
        waterArea: 0.4,
        ndti: 0.25,
        ndci: 0.25,
        encroachment: 0.1,
      },
      explanationEn,
      explanationHi,
    };
  }
}

