export interface LocalPractice {
  slug: string;
  titleEn: string;
  titleHi: string;
  category: 'water_harvesting' | 'soil_conservation' | 'agroforestry' | 'seeds';
  descriptionEn: string;
  descriptionHi: string;
  localRelevance: string;
  applicationMethod: string;
  benefits: string[];
  supportingSource: string;
}

export const SOUTHERN_RAJASTHAN_PRACTICES: LocalPractice[] = [
  {
    slug: 'taanka',
    titleEn: 'Taanka (Traditional Rainwater Cistern)',
    titleHi: 'टांका (पारंपरिक वर्षा जल संचयन कुंड)',
    category: 'water_harvesting',
    descriptionEn: 'An underground circular masonry cistern designed with an artificially sloped catchment (Agor) to harvest clean rainwater.',
    descriptionHi: 'गोल पक्का भूमिगत कुंड जिसके चारों ओर कृत्रिम आगोर (ढलानदार जलग्रहण) बनाकर शुद्ध वर्षा जल संचित किया जाता है।',
    localRelevance: 'Widely adapted across Mewar and Vagad for household and emergency nursery irrigation.',
    applicationMethod: 'Constructed at the lowest slope point with silt catchers and natural lime lining.',
    benefits: ['Provides drinking and critical irrigation water for 6-8 dry months', 'Zero evaporation losses compared to open surface ponds'],
    supportingSource: 'Central Arid Zone Research Institute (CAZRI) / Tarun Bharat Sangh',
  },
  {
    slug: 'johad',
    titleEn: 'Johad (Earthen Check Dam)',
    titleHi: 'जोहड़ (मिट्टी का जल संचयन बांध)',
    category: 'water_harvesting',
    descriptionEn: 'A simple crescent-shaped earthen embankment built across natural contours to trap monsoon runoff and recharge groundwater.',
    descriptionHi: 'प्राकृतिक ढलान पर अर्ध-चंद्राकार मिट्टी की पाल जो मानसूनी बहाव को रोककर भूजल स्तर को तेजी से बढ़ाती है।',
    localRelevance: 'Recharges dried community wells across Aravalli foothill villages.',
    applicationMethod: 'Built across micro-catchments with native stone riprap on the water-facing slope.',
    benefits: ['Raises water table by 2-5 metres in downstream open wells', 'Prevents flash-flood erosion on lower fields'],
    supportingSource: 'Rajendra Singh (Waterman of India) / Mewar Watershed Documentation',
  },
  {
    slug: 'nadi',
    titleEn: 'Nadi (Village Catchment Pond)',
    titleHi: 'नाड़ी (ग्राम पंचायत जलग्रहण पोखर)',
    category: 'water_harvesting',
    descriptionEn: 'Community village pond built in natural low-lying depressions to collect surface runoff from surrounding rocky ridges.',
    descriptionHi: 'पहाड़ी ढलानों से आने वाले सतही जल को रोकने के लिए प्राकृतिक गड्ढों में निर्मित सामुदायिक तालाब।',
    localRelevance: 'Primary livestock watering and pre-sowing soil saturation source.',
    applicationMethod: 'Desilted every summer before monsoon; excavated silt applied to fields as nutrient-rich organic manure.',
    benefits: ['Sustains livestock and secondary kharif irrigation', 'Enriches agricultural soil through collected nutrient silt'],
    supportingSource: 'ICAR-CRIDA Traditional Water Harvesting Systems',
  },
  {
    slug: 'anicut',
    titleEn: 'Anicut & Loose Stone Check Dams',
    titleHi: 'एनिकट एवं पत्थर की चेकडैम संरचनाएं',
    category: 'water_harvesting',
    descriptionEn: 'Small masonry or loose-boulder barriers across seasonal streams (nalas) that reduce runoff velocity and store water.',
    descriptionHi: 'मौसमी बरसाती नालों पर पत्थरों या चिनाई से बनी छोटी रुकावट जो बहाव की गति धीमी कर जल संचय करती है।',
    localRelevance: 'Protects Aravalli valley fields from deep gully erosion.',
    applicationMethod: 'Constructed at narrow stream bottlenecks with overflow spillways.',
    benefits: ['Retains fertile topsoil washed from upstream ridges', 'Creates persistent sub-surface moisture in valley floors'],
    supportingSource: 'Rajasthan Watershed Development and Soil Conservation Department',
  },
  {
    slug: 'wadi-agroforestry',
    titleEn: 'Wadi Tribal Agroforestry Model',
    titleHi: 'वाड़ी बहुस्तरीय कृषि-वानिकी मॉडल',
    category: 'agroforestry',
    descriptionEn: 'A tree-based multi-tier farming model combining fruit trees (Mango, Guava, Aonla) with forestry borders and intercrops.',
    descriptionHi: 'एक एकड़ मॉडल: मध्य में फलदार वृक्ष (आम, अमरूद, आंवला), मेड़ पर वानिकी पेड़ और बीच में दलहनी अंतःफसलें।',
    localRelevance: 'Standardized by BAIF across tribal tracts of Udaipur, Banswara, and Dungarpur.',
    applicationMethod: 'Border live fencing with Karonda/Bamboo, fruit trees planted on 5x5m grid with basin mulching.',
    benefits: ['Diversifies income through drought-tolerant tree crops', 'Increases year-round vegetative canopy cover to 70%+'],
    supportingSource: 'BAIF Development Research Foundation / NABARD Tribal Development Fund',
  },
  {
    slug: 'contour-bunding',
    titleEn: 'Contour Bunding & Grass Strips',
    titleHi: 'समोच्च मेड़बंदी एवं घास की जैविक पट्टियां',
    category: 'soil_conservation',
    descriptionEn: 'Earthen bunds built strictly along elevation contours to intercept overland runoff and foster percolation.',
    descriptionHi: 'समान ऊंचाई की रेखा (कंटूर) पर बनाई गई मिट्टी की मेड़ें जो पानी के सीधे बहाव को रोककर जमीन में समाने देती हैं।',
    localRelevance: 'Crucial for undulating piedmont slopes of Southern Rajasthan.',
    applicationMethod: 'Laid using A-frame or dumpy level at 1-2m vertical intervals, reinforced with Vetiver or Dhaman grass.',
    benefits: ['Reduces soil erosion by up to 65%', 'Increases soil moisture retention for Rabi wheat/mustard crops'],
    supportingSource: 'Rajasthan Agricultural University (MPUAT) Udaipur',
  },
  {
    slug: 'traditional-seeds',
    titleEn: 'Indigenous Drought-Hardy Seed Varieties',
    titleHi: 'पारंपरिक देसी सूखा-सहनशील बीज किस्में',
    category: 'seeds',
    descriptionEn: 'Locally adapted open-pollinated landraces like Desi Sathi Makka (60-day corn) and Malvi Kathiya wheat.',
    descriptionHi: 'मेवाड़ की जलवायु-अनुकूल किस्में जैसे 60 दिन में पकने वाला साथी मक्का और कम पानी वाला मालवी कठिया गेहूं।',
    localRelevance: 'Matures before late-season monsoon breaks, high fodder value and pest resilience.',
    applicationMethod: 'Farm-saved seed selection, treated with Beejamrit before sowing.',
    benefits: ['Survives prolonged dry spells during critical flowering phase', 'Requires 40% less synthetic fertilizer input'],
    supportingSource: 'MPUAT Udaipur & Seva Mandir Seed Conservation Network',
  },
];

export class LocalKnowledgeService {
  public static getAllPractices(category?: string): LocalPractice[] {
    if (!category || category === 'all') return SOUTHERN_RAJASTHAN_PRACTICES;
    return SOUTHERN_RAJASTHAN_PRACTICES.filter((p) => p.category === category);
  }

  public static getPracticeBySlug(slug: string): LocalPractice | undefined {
    return SOUTHERN_RAJASTHAN_PRACTICES.find((p) => p.slug === slug);
  }
}

