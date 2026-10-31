/**
 * Southern Rajasthan — Regional Lake Registry
 * Provides static metadata for all monitored lakes.
 */

export interface LakeStaticInfo {
  slug: string;
  nameEn: string;
  nameHi: string;
  district: string;
  lat: number;
  lng: number;
  /** Approximate baseline water spread area in hectares (historical average) */
  baselineAreaHa: number;
  /** Year of construction / origin */
  builtYear?: number;
  description: string;
  descriptionHi: string;
  catchmentKm2?: number;
}

export const LAKES: LakeStaticInfo[] = [
  {
    slug: 'pichola',
    nameEn: 'Lake Pichola',
    nameHi: 'पिछोला झील',
    district: 'udaipur',
    lat: 24.571,
    lng: 73.674,
    baselineAreaHa: 694,
    builtYear: 1362,
    description: 'A historic artificial freshwater lake in Udaipur, built by Pichhu Banjara.',
    descriptionHi: 'उदयपुर में स्थित ऐतिहासिक कृत्रिम मीठे पानी की झील, जिसे पिच्छू बंजारा ने बनाया था।',
    catchmentKm2: 48,
  },
  {
    slug: 'fateh-sagar',
    nameEn: 'Fateh Sagar Lake',
    nameHi: 'फतेह सागर झील',
    district: 'udaipur',
    lat: 24.600,
    lng: 73.671,
    baselineAreaHa: 425,
    builtYear: 1678,
    description: 'Built in 1678 by Maharana Jai Singh, expanded after a breach in 1889.',
    descriptionHi: '1678 में महाराणा जय सिंह द्वारा निर्मित, 1889 में बांध टूटने के बाद पुनर्निर्मित।',
    catchmentKm2: 60,
  },
  {
    slug: 'swaroop-sagar',
    nameEn: 'Swaroop Sagar',
    nameHi: 'स्वरूप सागर',
    district: 'udaipur',
    lat: 24.579,
    lng: 73.682,
    baselineAreaHa: 35,
    description: 'A connecting lake between Pichola and Fateh Sagar.',
    descriptionHi: 'पिछोला और फतेह सागर के बीच की संयोजक झील।',
  },
  {
    slug: 'udai-sagar',
    nameEn: 'Udai Sagar',
    nameHi: 'उदय सागर',
    district: 'udaipur',
    lat: 24.531,
    lng: 73.797,
    baselineAreaHa: 1020,
    builtYear: 1559,
    description: 'Built by Maharana Udai Singh II in 1559 on the Berach river.',
    descriptionHi: '1559 में महाराणा उदय सिंह द्वितीय द्वारा बेराच नदी पर निर्मित।',
    catchmentKm2: 270,
  },
  {
    slug: 'badi-lake',
    nameEn: 'Badi Lake',
    nameHi: 'बड़ी झील',
    district: 'udaipur',
    lat: 24.625,
    lng: 73.636,
    baselineAreaHa: 880,
    builtYear: 1652,
    description: 'Constructed in 1652 by Maharana Raj Singh, also known as Jiyan Sagar.',
    descriptionHi: '1652 में महाराणा राज सिंह द्वारा निर्मित, जियान सागर के नाम से भी जानी जाती है।',
    catchmentKm2: 120,
  },
  {
    slug: 'jaisamand',
    nameEn: 'Jaisamand Lake',
    nameHi: 'जयसमंद झील',
    district: 'udaipur',
    lat: 23.940,
    lng: 74.069,
    baselineAreaHa: 8800,
    builtYear: 1685,
    description: 'One of the largest artificial lakes in Asia, built by Maharana Jai Singh in 1685.',
    descriptionHi: 'एशिया की सबसे बड़ी कृत्रिम झीलों में से एक, 1685 में महाराणा जय सिंह द्वारा निर्मित।',
    catchmentKm2: 6800,
  },
  {
    slug: 'rajsamand',
    nameEn: 'Rajsamand Lake',
    nameHi: 'राजसमंद झील',
    district: 'rajsamand',
    lat: 25.065,
    lng: 73.878,
    baselineAreaHa: 2180,
    builtYear: 1662,
    description: 'Built by Maharana Raj Singh in 1662 on the Gomti river.',
    descriptionHi: '1662 में महाराणा राज सिंह द्वारा गोमती नदी पर निर्मित।',
    catchmentKm2: 880,
  },
  {
    slug: 'gaib-sagar',
    nameEn: 'Gaib Sagar',
    nameHi: 'गैब सागर',
    district: 'dungarpur',
    lat: 23.844,
    lng: 73.714,
    baselineAreaHa: 180,
    description: 'A historic lake in Dungarpur town, important for local ecology.',
    descriptionHi: 'डूंगरपुर शहर में स्थित ऐतिहासिक झील, जो स्थानीय पारिस्थितिकी के लिए महत्वपूर्ण है।',
  },
  {
    slug: 'mahi-bajaj-sagar',
    nameEn: 'Mahi Bajaj Sagar',
    nameHi: 'माही बजाज सागर',
    district: 'banswara',
    lat: 23.551,
    lng: 74.455,
    baselineAreaHa: 31,
    builtYear: 1983,
    description: 'Reservoir on the Mahi river near Banswara, providing irrigation and hydropower.',
    descriptionHi: 'बांसवाड़ा के पास माही नदी पर बना जलाशय, जो सिंचाई और जलविद्युत प्रदान करता है।',
    catchmentKm2: 25,
  },
  {
    slug: 'goverdhan-sagar',
    nameEn: 'Goverdhan Sagar',
    nameHi: 'गोवर्धन सागर',
    district: 'udaipur',
    lat: 24.544,
    lng: 73.681,
    baselineAreaHa: 38,
    builtYear: 1951,
    description: 'Southern lake of Udaipur linked to Lake Pichola via an overflow channel.',
    descriptionHi: 'उदयपुर की दक्षिणी झील जो ओवरफ्लो चैनल के माध्यम से पिछोला झील से जुड़ी है।',
    catchmentKm2: 14,
  },
  {
    slug: 'madar-tank',
    nameEn: 'Madar Tank (Bada Madar)',
    nameHi: 'मदार तालाब (बड़ा मदार)',
    district: 'udaipur',
    lat: 24.669,
    lng: 73.606,
    baselineAreaHa: 145,
    builtYear: 1640,
    description: 'Upstream catchment reservoir on the Ahar river feeding Fateh Sagar via the Chikalwas feeder canal.',
    descriptionHi: 'आहड़ नदी पर बना ऊपरी कैचमेंट जलाशय जो चिकलवास फीडर नहर से फतेह सागर को जल देता है।',
    catchmentKm2: 95,
  },
  {
    slug: 'vallabhnagar-reservoir',
    nameEn: 'Vallabhnagar Reservoir',
    nameHi: 'वल्लभनगर जलाशय',
    district: 'udaipur',
    lat: 24.675,
    lng: 74.002,
    baselineAreaHa: 910,
    builtYear: 1964,
    description: 'Major irrigation reservoir on the Berach river basin in eastern Udaipur district.',
    descriptionHi: 'पूर्वी उदयपुर जिले में बेराच नदी बेसिन पर प्रमुख सिंचाई जलाशय।',
    catchmentKm2: 410,
  },
];

export function getLakeBySlug(slug: string): LakeStaticInfo | undefined {
  return LAKES.find((l) => l.slug === slug);
}

