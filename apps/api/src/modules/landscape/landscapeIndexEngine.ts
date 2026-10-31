/**
 * Ridge-to-Lake Landscape Health Index Engine
 *
 * Formula:
 * - Aravalli vegetation integrity: 25% weight
 * - Watershed erosion resilience: 25% weight
 * - Regional lake health: 30% weight
 * - Community farm regenerative score: 20% weight (only if >= 5 farms present)
 *
 * Dynamic Rebalancing: If any component is unavailable, drop it and rebalance
 * the remaining components proportionally to maintain a 100-point scale.
 */

export interface LandscapeIndexInput {
  aravalliVegetationScore?: number | null; // 0 - 100
  watershedResilienceScore?: number | null; // 0 - 100 (inverse of erosion risk)
  lakeHealthScore?: number | null; // 0 - 100
  farmRegenerativeScore?: number | null; // 0 - 100
  farmCount?: number; // Minimum 5 farms required for anonymous aggregation
}

export interface LandscapeIndexResult {
  score: number | null; // 0 - 100 or null when no components have data
  status: 'critical' | 'degraded' | 'moderate' | 'healthy' | 'thriving' | 'no_data';
  activeComponents: Array<{
    name: string;
    originalWeight: number;
    effectiveWeight: number;
    value: number;
  }>;
  droppedComponents: string[];
  bannerQuoteEn: string;
  bannerQuoteHi: string;
}

export class LandscapeIndexEngine {
  public static calculate(input: LandscapeIndexInput): LandscapeIndexResult {
    const rawComponents = [
      {
        name: 'aravalliVegetation',
        weight: 0.25,
        value: input.aravalliVegetationScore,
      },
      {
        name: 'watershedResilience',
        weight: 0.25,
        value: input.watershedResilienceScore,
      },
      {
        name: 'lakeHealth',
        weight: 0.30,
        value: input.lakeHealthScore,
      },
      {
        name: 'farmRegenerative',
        weight: 0.20,
        // Only include if at least 5 farms contribute
        value: (input.farmCount || 0) >= 5 ? input.farmRegenerativeScore : null,
      },
    ];

    const active = rawComponents.filter(
      (c) => typeof c.value === 'number' && !isNaN(c.value) && c.value >= 0
    );
    const dropped = rawComponents
      .filter((c) => typeof c.value !== 'number' || isNaN(c.value) || c.value < 0)
      .map((c) => c.name);

    if (active.length === 0) {
      return {
        score: null,
        status: 'no_data',
        activeComponents: [],
        droppedComponents: rawComponents.map((c) => c.name),
        bannerQuoteEn: 'What happens upstream reaches your lake.',
        bannerQuoteHi: 'पहाड़ से निकली हर बूंद और मिट्टी की हर परत आपकी झील तक पहुंचती है।',
      };
    }

    // Rebalance remaining weights to sum to 1.0
    const totalWeight = active.reduce((acc, c) => acc + c.weight, 0);
    let weightedSum = 0;

    const activeWithEffectiveWeights = active.map((c) => {
      const effectiveWeight = c.weight / totalWeight;
      weightedSum += (c.value as number) * effectiveWeight;
      return {
        name: c.name,
        originalWeight: c.weight,
        effectiveWeight: Number(effectiveWeight.toFixed(3)),
        value: Math.round(c.value as number),
      };
    });

    const score = Math.max(0, Math.min(100, Math.round(weightedSum)));

    let status: LandscapeIndexResult['status'] = 'moderate';
    if (score >= 80) status = 'thriving';
    else if (score >= 65) status = 'healthy';
    else if (score >= 50) status = 'moderate';
    else if (score >= 35) status = 'degraded';
    else status = 'critical';

    return {
      score,
      status,
      activeComponents: activeWithEffectiveWeights,
      droppedComponents: dropped,
      bannerQuoteEn: 'What happens upstream reaches your lake.',
      bannerQuoteHi: 'पहाड़ से निकली हर बूंद और मिट्टी की हर परत आपकी झील तक पहुंचती है।',
    };
  }
}
