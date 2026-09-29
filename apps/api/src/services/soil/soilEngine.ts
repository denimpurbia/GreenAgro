export interface SoilInput {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon: number;
}

export interface SoilResult {
  score: number;
  rating: 'Poor' | 'Moderate' | 'Good' | 'Excellent';
  nutrients: {
    name: string;
    value: number;
    unit: string;
    status: 'Low' | 'Medium' | 'Good' | 'Optimal';
    color: 'red' | 'amber' | 'green';
  }[];
  limitingFactor: string;
  aiInsight: string;
  recommendations: string[];
}

export class SoilEngine {
  public static calculate(input: SoilInput): SoilResult {
    // 1. pH score (optimal around 6.5 - 7.0, neutral)
    const phDist = Math.abs(input.ph - 6.8);
    const phScore = Math.max(0, 100 - phDist * 40);

    // 2. Nitrogen score (target ~70 kg/ha)
    const nScore = Math.min(100, Math.max(0, (input.nitrogen / 70) * 100));

    // 3. Phosphorus score (target ~35 kg/ha)
    const pScore = Math.min(100, Math.max(0, (input.phosphorus / 35) * 100));

    // 4. Potassium score (target ~50 kg/ha)
    const kScore = Math.min(100, Math.max(0, (input.potassium / 50) * 100));

    // 5. Organic Carbon score (target ~1.0%)
    const ocScore = Math.min(100, Math.max(0, (input.organicCarbon / 1.0) * 100));

    // Scientific weighted composite score (0-100) based strictly on input values
    const overall = Math.round(
      phScore * 0.20 + nScore * 0.35 + pScore * 0.15 + kScore * 0.15 + ocScore * 0.15
    );

    const nutrients = [
      {
        name: 'Nitrogen',
        value: input.nitrogen,
        unit: 'kg/ha',
        status: input.nitrogen < 45 ? ('Low' as const) : input.nitrogen < 65 ? ('Medium' as const) : ('Good' as const),
        color: input.nitrogen < 45 ? ('red' as const) : input.nitrogen < 65 ? ('amber' as const) : ('green' as const),
      },
      {
        name: 'Phosphorus',
        value: input.phosphorus,
        unit: 'kg/ha',
        status: input.phosphorus < 20 ? ('Low' as const) : input.phosphorus < 30 ? ('Medium' as const) : ('Good' as const),
        color: input.phosphorus < 20 ? ('red' as const) : input.phosphorus < 30 ? ('amber' as const) : ('green' as const),
      },
      {
        name: 'Potassium',
        value: input.potassium,
        unit: 'kg/ha',
        status: input.potassium < 20 ? ('Low' as const) : input.potassium < 35 ? ('Medium' as const) : ('Good' as const),
        color: input.potassium < 20 ? ('red' as const) : ('green' as const),
      },
      {
        name: 'Organic Carbon',
        value: input.organicCarbon,
        unit: '%',
        status: input.organicCarbon < 0.5 ? ('Low' as const) : input.organicCarbon < 0.75 ? ('Good' as const) : ('Optimal' as const),
        color: input.organicCarbon < 0.5 ? ('amber' as const) : ('green' as const),
      },
    ];

    // Determine limiting factor
    const deficient = nutrients.filter((n) => n.color === 'red');
    const moderate = nutrients.filter((n) => n.color === 'amber');
    const limiting = deficient[0] || moderate[0] || nutrients[0];

    // Generate recommendations dynamically from specific deficiencies
    const recommendations: string[] = [];

    if (input.ph < 6.0) {
      recommendations.push(
        `Soil pH is acidic (${input.ph}). Apply agricultural lime (calcium carbonate) or dolomite to neutralize acidity and unlock micronutrient availability.`
      );
    } else if (input.ph > 7.8) {
      recommendations.push(
        `Soil pH is alkaline (${input.ph}). Apply agricultural gypsum or elemental sulfur with organic compost to moderate alkalinity and prevent phosphorus fixation.`
      );
    }

    if (input.nitrogen < 45) {
      recommendations.push(
        `Nitrogen is low (${input.nitrogen} kg/ha). Incorporate nitrogen-fixing green manure (Sesbania/Sunnhemp) or well-rotted FYM to rebuild vegetative vigour.`
      );
    } else if (input.nitrogen < 65) {
      recommendations.push(
        `Nitrogen is moderate (${input.nitrogen} kg/ha). Split-apply organic biofertilizers (Azotobacter/Rhizobium) during early tillering.`
      );
    }

    if (input.phosphorus < 20) {
      recommendations.push(
        `Phosphorus is deficient (${input.phosphorus} kg/ha). Apply rock phosphate inoculated with Phosphate Solubilizing Bacteria (PSB) for root development.`
      );
    }

    if (input.potassium < 20) {
      recommendations.push(
        `Potassium is low (${input.potassium} kg/ha). Apply sulfate of potash or wood ash and retain crop residue mulch to enhance drought and pest tolerance.`
      );
    }

    if (input.organicCarbon < 0.5) {
      recommendations.push(
        `Soil Organic Carbon is critically low (${input.organicCarbon}%). Apply 5-8 tonnes/ha vermicompost or composted biomass and cease crop residue burning.`
      );
    } else if (input.organicCarbon < 0.75) {
      recommendations.push(
        `Soil Organic Carbon is moderate (${input.organicCarbon}%). Practice surface stubble mulching and multi-species cover cropping to reach optimal >0.75%.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Soil nutrient balance is optimal. Practice minimal disturbance tillage and diverse crop rotation to maintain microbial biodiversity.'
      );
      recommendations.push(
        'Monitor soil moisture regularly and maintain organic ground cover across seasonal transitions.'
      );
    }

    const aiInsight = deficient.length > 0
      ? `${limiting.name} is the primary limiting nutrient (${limiting.value} ${limiting.unit}). Prioritize corrective organic amendments before planting.`
      : overall >= 80
      ? 'Soil exhibits healthy fertility parameters with high organic vitality. Suitable for demanding high-value crops.'
      : 'Soil health is moderate with opportunities to improve organic carbon and fertility balance.';

    return {
      score: overall,
      rating: overall >= 80 ? 'Excellent' : overall >= 70 ? 'Good' : overall >= 50 ? 'Moderate' : 'Poor',
      nutrients,
      limitingFactor: deficient.length > 0
        ? `${limiting.name} (${limiting.value} ${limiting.unit}) is below target threshold.`
        : 'All measured primary nutrients meet baseline requirements.',
      aiInsight,
      recommendations,
    };
  }
}
