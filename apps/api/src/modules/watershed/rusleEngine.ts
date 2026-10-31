/**
 * RUSLE-Lite Soil Erosion Engine
 *
 * Formula: A = R × K × LS × C × P
 *
 * Where:
 * - A  = Estimated annual soil loss (metric tons / hectare / year)
 * - R  = Rainfall erosivity factor (from annual precipitation / CHIRPS)
 * - K  = Soil erodibility factor (from soil texture / SoilGrids)
 * - LS = Slope length and steepness factor (from SRTM DEM)
 * - C  = Cover-management factor (from Sentinel NDVI crop cover)
 * - P  = Conservation support practice factor (contour bunding, terracing, etc.)
 */

export interface RusleInput {
  slopeDeg: number;
  annualRainfallMm?: number; // Southern Rajasthan average ~650-750mm
  soilType?: string; // e.g. 'clay', 'loam', 'sandy', 'black', 'red'
  ndvi?: number; // 0 - 1 vegetation proxy
  hasConservationPractices?: boolean;
}

export interface RusleResult {
  a: number; // Estimated soil loss in t/ha/year
  r: number;
  k: number;
  ls: number;
  c: number;
  p: number;
  risk: 'low' | 'moderate' | 'high' | 'severe';
  recommendations: string[];
  recommendationsHi: string[];
}

export class RusleEngine {
  public static calculate(input: RusleInput): RusleResult {
    const {
      slopeDeg = 3.5,
      annualRainfallMm = 700,
      soilType = 'loam',
      ndvi = 0.45,
      hasConservationPractices = false,
    } = input;

    // 1. R Factor (Rainfall Erosivity)
    // Common empirical relation for Indian sub-humid tropics: R ≈ 0.5 * P (where P is annual rainfall in mm)
    const r = Math.round(0.48 * annualRainfallMm);

    // 2. K Factor (Soil Erodibility)
    // Silt and fine sand are most erodible (0.04-0.05), clay and organic soils less erodible (0.015-0.025)
    let k = 0.03;
    const lowerSoil = soilType.toLowerCase();
    if (lowerSoil.includes('sandy') || lowerSoil.includes('coarse')) k = 0.045;
    else if (lowerSoil.includes('clay') || lowerSoil.includes('black')) k = 0.022;
    else if (lowerSoil.includes('red') || lowerSoil.includes('loam')) k = 0.032;

    // 3. LS Factor (Slope Length & Steepness)
    // Simplified Wischmeier & Smith: LS = (L/22.1)^m * (65.41 * sin^2(theta) + 4.56 * sin(theta) + 0.065)
    // For standard field length (L ≈ 50m):
    const rad = (slopeDeg * Math.PI) / 180;
    const sinTheta = Math.sin(rad);
    const ls = Number(Math.max(0.1, (2.26 * (65.41 * sinTheta * sinTheta + 4.56 * sinTheta + 0.065))).toFixed(2));

    // 4. C Factor (Vegetation Cover Factor)
    // Higher NDVI means denser canopy and lower soil impact
    // C ranges from 0.05 (dense perennial cover) to 0.6 (bare fallow)
    let c = 0.25;
    if (ndvi > 0.6) c = 0.08;
    else if (ndvi > 0.4) c = 0.18;
    else if (ndvi > 0.2) c = 0.35;
    else c = 0.55;

    // 5. P Factor (Support Practice Factor)
    // 1.0 for straight up-and-down slope tillage, 0.5 for contour bunding, 0.15 for graded stone terracing
    const p = hasConservationPractices ? 0.45 : 0.85;

    // A = R * K * LS * C * P (metric tons / hectare / year)
    const a = Number((r * k * ls * c * p).toFixed(1));

    // Risk Classification
    let risk: RusleResult['risk'] = 'low';
    if (a >= 30) risk = 'severe';
    else if (a >= 15) risk = 'high';
    else if (a >= 5) risk = 'moderate';
    else risk = 'low';

    // Rule-based conservation recommendations:
    const recommendations: string[] = [];
    const recommendationsHi: string[] = [];

    if (slopeDeg >= 8 && slopeDeg <= 15) {
      recommendations.push('Stone bunds and graded terracing to stabilize steep runoff pathways.');
      recommendationsHi.push('ढलान पर जल बहाव को धीमा करने के लिए पत्थर की मेड़बंदी (Stone Bunds) और सीढ़ीदार खेत।');
    } else if (slopeDeg >= 3 && slopeDeg < 8) {
      recommendations.push('Contour bunding and vetiver/local grass vegetative strips across the slope.');
      recommendationsHi.push('समोच्च मेड़बंदी (कंटूर बंडिंग) और ढलान के विपरीत खस/घास की जैविक पट्टियां लगाएं।');
    } else {
      recommendations.push('Cover cropping, mulching, and minimum tillage to protect topsoil.');
      recommendationsHi.push('मिट्टी की नमी बनाए रखने और कटाव रोकने के लिए आच्छादन (मल्चिंग) और कवर फसलें।');
    }

    if (risk === 'high' || risk === 'severe') {
      recommendations.push('Construct gully plugs and loose stone check dams across natural drainage paths.');
      recommendationsHi.push('प्राकृतिक जल निकासी नालों पर गली प्लग और पत्थर के चेकडैम (बोरी-बांध) बनाएं।');
    }

    recommendations.push('Direct excess monsoon runoff into farm ponds (Khet Talai) or local recharge wells.');
    recommendationsHi.push('अतिरिक्त मानसूनी पानी को खेत तलाई या रिचार्ज कुओं में संरक्षित करें।');

    return {
      a,
      r,
      k,
      ls,
      c,
      p,
      risk,
      recommendations,
      recommendationsHi,
    };
  }
}

