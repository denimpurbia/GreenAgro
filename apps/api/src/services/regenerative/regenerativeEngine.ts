export interface RegenerativeInput {
  soilScore?: number | null;
  irrigationType?: string;
  hasDrip?: boolean;
  cropRotationCycles?: number;
  cropName?: string;
  ndvi?: number | null;
  organicPracticeAdopted?: boolean;
}

export interface RegenerativePillar {
  name: string;
  score: number;
  weight: number;
  status: 'Critical' | 'Developing' | 'Good' | 'Optimal';
}

export interface RegenerativeRecommendation {
  id: string;
  title: string;
  category: 'soil' | 'water' | 'crop' | 'resilience' | 'vegetation';
  description: string;
  expectedBenefit: string;
  timeHorizon: string;
}

export class RegenerativeEngine {
  public static calculate(input: RegenerativeInput) {
    // 1. Water Efficiency Pillar (0 - 100) based on actual irrigation infrastructure
    let waterScore = 45; // Default unconfigured / traditional baseline
    const irr = (input.irrigationType || '').toLowerCase();
    if (input.hasDrip || irr.includes('drip')) {
      waterScore = 88;
    } else if (irr.includes('sprinkler') || irr.includes('micro')) {
      waterScore = 72;
    } else if (irr.includes('furrow') || irr.includes('alternate')) {
      waterScore = 55;
    } else if (irr.includes('flood')) {
      waterScore = 38;
    } else if (irr.includes('rainfed') || irr.includes('dryland')) {
      waterScore = 50;
    }

    // 2. Crop Diversity Pillar (0 - 100) based on actual rotation cycles
    const cycles = Math.max(0, Number(input.cropRotationCycles ?? 1));
    let cropScore = 35; // Monoculture baseline
    if (cycles >= 3) {
      cropScore = 90;
    } else if (cycles === 2) {
      cropScore = 70;
    } else if (cycles === 1) {
      cropScore = 50;
    }

    // 3. Climate Resilience Pillar (0 - 100) based on organic adoption and practices
    let resilienceScore = 42;
    if (input.organicPracticeAdopted) {
      resilienceScore += 35;
    }
    if (input.hasDrip) {
      resilienceScore += 10;
    }
    if (cycles >= 2) {
      resilienceScore += 10;
    }
    resilienceScore = Math.min(100, resilienceScore);

    // 4. Soil Health Pillar (if tested)
    const hasSoil = input.soilScore !== null && input.soilScore !== undefined && isFinite(Number(input.soilScore));
    const soilScore = hasSoil ? Math.max(0, Math.min(100, Math.round(Number(input.soilScore)))) : null;

    // 5. Vegetation Health Pillar (from real NDVI when available)
    const hasNdvi = input.ndvi !== null && input.ndvi !== undefined && isFinite(Number(input.ndvi));
    const vegetationScore = hasNdvi ? Math.max(0, Math.min(100, Math.round(Number(input.ndvi) * 100))) : null;

    // Build pillars list dynamically
    const pillars: RegenerativePillar[] = [];

    const getStatus = (score: number): RegenerativePillar['status'] => {
      if (score >= 80) return 'Optimal';
      if (score >= 65) return 'Good';
      if (score >= 50) return 'Developing';
      return 'Critical';
    };

    if (soilScore !== null) {
      pillars.push({
        name: 'Soil Health',
        score: soilScore,
        weight: 30,
        status: getStatus(soilScore),
      });
    }

    pillars.push({
      name: 'Water Efficiency',
      score: waterScore,
      weight: soilScore !== null ? 25 : 35,
      status: getStatus(waterScore),
    });

    pillars.push({
      name: 'Crop Diversity',
      score: cropScore,
      weight: soilScore !== null ? 25 : 35,
      status: getStatus(cropScore),
    });

    if (vegetationScore !== null) {
      pillars.push({
        name: 'Vegetation Health',
        score: vegetationScore,
        weight: 10,
        status: getStatus(vegetationScore),
      });
    }

    pillars.push({
      name: 'Climate Resilience',
      score: resilienceScore,
      weight: soilScore !== null ? 10 : 30,
      status: getStatus(resilienceScore),
    });

    // Calculate deterministic weighted overall composite score
    const totalWeight = pillars.reduce((sum, p) => sum + p.weight, 0);
    const rawOverall = pillars.reduce((sum, p) => sum + p.score * (p.weight / totalWeight), 0);
    const overallScore = Math.round(rawOverall);

    // Dynamic recommendations targeting actual low pillars
    const recommendations: RegenerativeRecommendation[] = [];

    if (soilScore !== null && soilScore < 65) {
      recommendations.push({
        id: 'rec-soil-amend',
        title: 'Enhance Soil Microbial Biology',
        category: 'soil',
        description: 'Apply farm-produced vermicompost or well-decomposed manure and minimize aggressive tilling to restore soil biology.',
        expectedBenefit: '+15-20% improved nutrient retention and reduced synthetic input dependence.',
        timeHorizon: 'Current Pre-Sowing Phase',
      });
    }

    if (waterScore < 70) {
      recommendations.push({
        id: 'rec-water-drip',
        title: 'Upgrade Irrigation Efficiency',
        category: 'water',
        description: 'Adopt localized micro-drip or scheduled furrow fertigation aligned with crop evapotranspiration to conserve water.',
        expectedBenefit: 'Save 25-40% irrigation water and reduce pumping power requirements.',
        timeHorizon: 'Next 60 Days',
      });
    }

    if (cropScore < 70) {
      const crop = input.cropName || 'primary crop';
      recommendations.push({
        id: 'rec-crop-rotation',
        title: 'Implement Legume-Inclusive Rotation',
        category: 'crop',
        description: `Rotate ${crop} with nitrogen-fixing pulses (such as chickpea, moong, or cowpea) to break pest cycles and fix biological nitrogen.`,
        expectedBenefit: 'Natural biological nitrogen fixation of 25-45 kg N/ha for subsequent season.',
        timeHorizon: 'Next Seasonal Cycle',
      });
    }

    if (resilienceScore < 70) {
      recommendations.push({
        id: 'rec-resilience-mulch',
        title: 'Adopt Stubble Mulching & Cover Cropping',
        category: 'resilience',
        description: 'Retain standing crop residue on field surfaces instead of burning to preserve topsoil moisture and prevent wind erosion.',
        expectedBenefit: 'Suppresses weed germination by up to 50% and moderates summer root-zone temperatures.',
        timeHorizon: 'Post-Harvest Transition',
      });
    }

    if (vegetationScore !== null && vegetationScore < 60) {
      recommendations.push({
        id: 'rec-vegetation-scout',
        title: 'Targeted Canopy Health Scouting',
        category: 'vegetation',
        description: 'Satellite NDVI signals reduced canopy vigour in sub-plots. Scout affected zones for localized moisture stress or pest onset.',
        expectedBenefit: 'Early intervention prevents yield penalties across vegetative zones.',
        timeHorizon: 'Immediate Action (3-5 Days)',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec-maintain-optimal',
        title: 'Sustain Regenerative Practices',
        category: 'soil',
        description: 'Current regenerative indicators reflect strong farm stewardship. Continue multi-species cover cropping and biological amendments.',
        expectedBenefit: 'Progressive building of soil carbon reserves and long-term climate resilience.',
        timeHorizon: 'Ongoing Stewardship',
      });
    }

    return {
      overallScore,
      ratingLabel:
        overallScore >= 80 ? 'Optimal' : overallScore >= 65 ? 'Good Progress' : overallScore >= 50 ? 'Developing' : 'Emerging',
      pillars,
      keyRecommendations: recommendations,
    };
  }
}
