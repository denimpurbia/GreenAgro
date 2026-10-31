import { SchemeModel } from '../../models/Scheme';

export const OFFICIAL_SCHEMES = [
  {
    code: 'SOIL_HEALTH_CARD',
    nameEn: 'Soil Health Card Scheme',
    nameHi: 'मृदा स्वास्थ्य कार्ड योजना',
    category: 'soil' as const,
    descriptionEn: 'Provides customized crop-wise nutrient recommendations to reduce fertilizer cost and preserve soil biological health.',
    descriptionHi: 'फसल-वार पोषक तत्वों की सटीक सिफारिशें ताकि रासायनिक उर्वरक खर्च घटे और मिट्टी की जैविक सेहत सुधरे।',
    benefitsEn: 'Free soil testing report covering 12 parameters (NPK, Secondary, Micro-nutrients & Physical).',
    benefitsHi: '12 प्रमुख मापदंडों (NPK, सूक्ष्म पोषक तत्व और pH) पर मुफ्त मिट्टी जांच रिपोर्ट।',
    eligibilityEn: 'All farmers owning or cultivating agricultural land in Rajasthan.',
    eligibilityHi: 'राजस्थान के सभी भूमिधारक अथवा काश्तकार किसान।',
    officialUrl: 'https://soilhealth.dac.gov.in/',
    isNational: true,
  },
  {
    code: 'PM_KUSUM',
    nameEn: 'PM-KUSUM (Solar Agriculture Pump Scheme)',
    nameHi: 'पीएम-कुसुम (सौर ऊर्जा कृषि पंप योजना)',
    category: 'solar' as const,
    descriptionEn: 'Subsidy up to 60% for installing standalone solar agriculture pumps (Component B) in off-grid tribal and rural areas.',
    descriptionHi: 'ग्रिड-विहीन और दूरस्थ क्षेत्रों में 3 HP से 7.5 HP तक स्टैंडअलोन सोलर पंप लगाने पर 60% तक का अनुदान।',
    benefitsEn: 'Uninterrupted daytime solar irrigation, zero electricity/diesel bills.',
    benefitsHi: 'दिन के समय बिना बिजली बिल या डीजल खर्च के भरोसेमंद सौर सिंचाई।',
    eligibilityEn: 'Farmers with verified water source without existing grid connection.',
    eligibilityHi: 'वे किसान जिनके पास सिंचाई का जल स्रोत है लेकिन विद्युत कनेक्शन नहीं है।',
    officialUrl: 'https://pmkusum.mnre.gov.in/',
    isNational: true,
  },
  {
    code: 'PMFBY',
    nameEn: 'PM Fasal Bima Yojana (Crop Insurance)',
    nameHi: 'प्रधानमंत्री फसल बीमा योजना (पीएमएफबीवाई)',
    category: 'insurance' as const,
    descriptionEn: 'Comprehensive insurance cover against crop loss due to non-preventable natural risks (drought, flood, unseasonal rain).',
    descriptionHi: 'सूखा, बाढ़, कीट प्रकोप और बेमौसम बारिश से फसल खराबे पर व्यापक बीमा सुरक्षा।',
    benefitsEn: 'Low farmer premium: 2% for Kharif, 1.5% for Rabi crops.',
    benefitsHi: 'न्यूनतम प्रीमियम दर: खरीफ के लिए 2% और रबी फसलों के लिए मात्र 1.5%।',
    eligibilityEn: 'All loanee and non-loanee farmers growing notified crops in notified areas.',
    eligibilityHi: 'अधिसूचित क्षेत्रों में अधिसूचित फसलें बोने वाले सभी ऋणी और गैर-ऋणी किसान।',
    officialUrl: 'https://pmfby.gov.in/',
    isNational: true,
  },
  {
    code: 'PMKSY_PDMC',
    nameEn: 'PMKSY — Per Drop More Crop (Drip & Sprinkler)',
    nameHi: 'पीएम कृषि सिंचाई योजना — प्रति बूंद अधिक फसल (ड्रिप/फव्वारा)',
    category: 'irrigation' as const,
    descriptionEn: 'Up to 70% subsidy for small/marginal and tribal farmers in Rajasthan for micro-irrigation systems.',
    descriptionHi: 'ड्रिप (टपक) और स्प्रिंकलर (फव्वारा) सिंचाई संयंत्र स्थापित करने पर लघु/सीमांत किसानों को 70% तक अनुदान।',
    benefitsEn: 'Saves 40-50% water, increases crop yield by 20-30%.',
    benefitsHi: '40-50% पानी की बचत, उत्पादन में 20-30% तक की वृद्धि।',
    eligibilityEn: 'Farmers having assured water source and land holding.',
    eligibilityHi: 'कृषि योग्य भूमि और पक्के जल स्रोत वाले सभी कृषक।',
    officialUrl: 'https://pmksy.gov.in/',
    isNational: true,
  },
  {
    code: 'RAJASTHAN_FARM_POND',
    nameEn: 'Rajasthan Khet Talai (Farm Pond) Subsidy',
    nameHi: 'राजस्थान खेत तलाई (फार्म पॉन्ड) अनुदान योजना',
    category: 'subsidy' as const,
    descriptionEn: 'State government subsidy for rainwater harvesting farm ponds (kuchha / plastic-lined khet talai).',
    descriptionHi: 'खेत में वर्षा जल संचयन हेतु कच्ची व प्लास्टिक लाइनिंग युक्त खेत तलाई बनाने पर राज्य सरकार का अनुदान।',
    benefitsEn: 'Subsidy up to ₹73,500 for non-lined or ₹1,05,000 for plastic-lined farm pond.',
    benefitsHi: 'कच्चे फार्म पॉन्ड पर ₹73,500 तथा प्लास्टिक लाइनिंग फार्म पॉन्ड पर ₹1,05,000 तक का अनुदान।',
    eligibilityEn: 'Minimum 0.5 hectare agricultural land holding in Rajasthan.',
    eligibilityHi: 'राजस्थान में न्यूनतम 0.5 हेक्टेयर कृषि भूमि का स्वामित्व।',
    officialUrl: 'https://rajkisan.rajasthan.gov.in/',
    isNational: false,
    state: 'Rajasthan',
  },
];

export class SchemeService {
  public static async ensureSeeded(): Promise<void> {
    try {
      const count = await SchemeModel.countDocuments();
      if (count >= OFFICIAL_SCHEMES.length) return;

      for (const s of OFFICIAL_SCHEMES) {
        await SchemeModel.updateOne(
          { code: s.code },
          { $set: s },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('[SchemeService] Seed notice:', err);
    }
  }

  public static async getAllSchemes(category?: string): Promise<any[]> {
    await this.ensureSeeded();
    const query: any = {};
    if (category && category !== 'all') query.category = category;
    return SchemeModel.find(query).sort({ isNational: 1, createdAt: -1 }).lean();
  }

  public static async upsertScheme(data: {
    code: string;
    nameEn: string;
    nameHi?: string;
    category: 'soil' | 'irrigation' | 'solar' | 'insurance' | 'organic' | 'subsidy';
    descriptionEn: string;
    descriptionHi?: string;
    benefitsEn: string;
    benefitsHi?: string;
    eligibilityEn: string;
    eligibilityHi?: string;
    officialUrl: string;
    isNational?: boolean;
    state?: string;
  }): Promise<any> {
    await this.ensureSeeded();
    const cleanCode = data.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    return SchemeModel.findOneAndUpdate(
      { code: cleanCode },
      {
        $set: {
          code: cleanCode,
          nameEn: data.nameEn.trim(),
          nameHi: (data.nameHi || data.nameEn).trim(),
          category: data.category,
          descriptionEn: data.descriptionEn.trim(),
          descriptionHi: (data.descriptionHi || data.descriptionEn).trim(),
          benefitsEn: data.benefitsEn.trim(),
          benefitsHi: (data.benefitsHi || data.benefitsEn).trim(),
          eligibilityEn: data.eligibilityEn.trim(),
          eligibilityHi: (data.eligibilityHi || data.eligibilityEn).trim(),
          officialUrl: data.officialUrl.trim(),
          isNational: Boolean(data.isNational),
          state: data.state || 'Rajasthan',
        },
      },
      { upsert: true, new: true }
    );
  }
}
