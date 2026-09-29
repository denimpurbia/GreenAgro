import { KnowledgePracticeModel, IKnowledgePractice } from '../../models/KnowledgePractice';
import { isConnectedToDb } from '../../database';

export const INITIAL_BRICS_PRACTICES = [
  {
    practiceId: 'prc-01',
    title: 'Khadin Runoff Farming in Rajasthan',
    country: 'India' as const,
    region: 'Jodhpur / Thar Desert, Rajasthan',
    crop: 'Rabi crops (Chickpea, Mustard, Wheat)',
    climateZone: 'Hot Arid / Desert',
    practiceType: 'Traditional water harvesting and runoff farming',
    description:
      'Khadin is a traditional runoff-farming system used in the Indian Thar Desert. It captures and stores monsoon runoff to support crop cultivation in arid conditions.',
    practiceDetails:
      'The Khadin system captures monsoon surface runoff from upland rocky catchments and channels it into low-lying agricultural valley floors bounded by an earthen bund (dhora). Captured floodwaters saturate the deep soil profile, depositing nutrient-rich fine silt and clay sediments while conserving subterranean moisture as standing water recedes. In the winter (Rabi season), farmers sow drought-hardy crops that mature on stored moisture without depleting groundwater aquifers. The system maximizes rain-use efficiency and stabilizes farm productivity across recurring dry years.',
    evidenceType: 'FAO AGRIS' as const,
    sourceOrganization: 'FAO AGRIS',
    sourceTitle:
      'Effect of Agronomic Intervention on the Productivity of Khadin Cultivated Rabi Crops in Arid Region for Enhancing Farm Income: A Case Study from Jodhpur (Rajasthan, India)',
    sourceYear: 2025,
    sourceUrl:
      'https://agris.fao.org/search/en/providers/122511/records/6995a610c53d3a78e777bd4f',
    researchEvidence: [
      '2025 study on agronomic interventions in Khadin cultivated Rabi crops in the arid region of Jodhpur, Rajasthan, indexed in FAO AGRIS.',
      'Traditional water-harvesting practice documented by ICAR Central Arid Zone Research Institute (CAZRI), Jodhpur.',
    ],
    expectedBenefit:
      'Conserves monsoon runoff to sustain Rabi crop cultivation on stored soil moisture in hyper-arid environments without groundwater depletion.',
    adaptationNotes:
      'Potentially adaptable where local soil, climate, water availability and farming systems are suitable; best suited for low-rainfall undulating terrains with high clay-loam moisture retention.',
    bricsRelevance:
      "Rajasthan's Khadin system contributes traditional knowledge on runoff harvesting and farming under arid conditions.",
    provenance: {
      sourceType: 'FAO AGRIS',
      organization: 'FAO AGRIS',
      title:
        'Effect of Agronomic Intervention on the Productivity of Khadin Cultivated Rabi Crops in Arid Region for Enhancing Farm Income: A Case Study from Jodhpur (Rajasthan, India)',
      year: 2025,
      url: 'https://agris.fao.org/search/en/providers/122511/records/6995a610c53d3a78e777bd4f',
      retrievedAt: '2026-09-29T09:00:00Z',
    },
    imageUrl: '/images/knowledge/india-khadin-farming.jpg',
    imageSource: 'Wikimedia Commons / ICAR-CAZRI (File:Khadin system of runoff farming.jpg)',
    imageLicense: 'CC BY-SA 4.0',
    imageAttribution: 'Akmu.cazri (ICAR - Central Arid Zone Research Institute, Jodhpur, Rajasthan)',
    tags: ['Water Harvesting', 'Runoff Farming', 'Arid Agriculture', 'Rabi Crops', 'Traditional Knowledge'],
    views: 0,
    likes: 0,
    likedByUsers: [] as string[],
  },
  {
    practiceId: 'prc-02',
    title: 'No-Tillage Crop Rotation with Cover Crops',
    country: 'Brazil' as const,
    region: 'Bahia / Brazilian Cerrado agricultural systems',
    crop: 'Soybean, maize, cotton',
    climateZone: 'Tropical Wet-Dry / Cerrado',
    practiceType: 'Conservation agriculture / no-tillage / crop rotation',
    description:
      'Brazilian research has investigated no-tillage systems combined with crop rotation, cover crops and green manure for improving soil conservation and agricultural sustainability.',
    practiceDetails:
      'The Brazilian conservation agriculture model integrates zero soil disturbance (direct drilling through undisturbed residues) with multi-crop rotations alternating soybean, maize, and cotton alongside persistent cover crops and green manures. Cover crop species such as Brachiaria (Urochloa ruziziensis) and Crotalaria provide continuous soil coverage, mitigating surface thermal degradation under intense tropical sun. Research by Embrapa indicates this system increases soil organic carbon stocks in sandy tropical soils, improves macro-porosity, and enhances biological quality and enzymatic activity without degrading soil structure under rainfed conditions.',
    evidenceType: 'Research Institution' as const,
    sourceOrganization: 'Embrapa',
    sourceTitle:
      'Organic carbon stock changes and crop yield in a tropical sandy soil under rainfed grains-cotton farming systems in Bahia, Brazil',
    sourceYear: 2022,
    sourceUrl:
      'https://www.embrapa.br/en/busca-de-publicacoes/-/publicacao/1146652/organic-carbon-stock-changes-and-crop-yield-in-a-tropical-sandy-soil-under-rainfed-grains-cotton-farming-systems-in-bahia-brazil',
    researchEvidence: [
      'Embrapa 2022 publication evaluating organic carbon stock changes and rainfed crop yields in sandy Cerrado soils of Bahia, Brazil.',
      'Complementary Embrapa Cerrados research (2026) evaluating effects of cover crop species on soil quality indicators and maize yield.',
    ],
    expectedBenefit:
      'Protects sandy tropical soils against erosion, builds soil organic carbon stock, and enhances soil biological quality in continuous grain-cotton systems.',
    adaptationNotes:
      'Potentially adaptable where local soil, climate, water availability and farming systems are suitable; requires careful termination timing so cover crops do not compete with primary cash crops for moisture in water-constrained zones.',
    bricsRelevance:
      'Brazilian no-tillage and cover-crop research provides evidence relevant to conservation agriculture and soil-carbon management.',
    provenance: {
      sourceType: 'Embrapa',
      organization: 'Empresa Brasileira de Pesquisa Agropecuária (Embrapa)',
      title:
        'Organic carbon stock changes and crop yield in a tropical sandy soil under rainfed grains-cotton farming systems in Bahia, Brazil',
      year: 2022,
      url: 'https://www.embrapa.br/en/busca-de-publicacoes/-/publicacao/1146652/organic-carbon-stock-changes-and-crop-yield-in-a-tropical-sandy-soil-under-rainfed-grains-cotton-farming-systems-in-bahia-brazil',
      retrievedAt: '2026-09-29T09:00:00Z',
    },
    imageUrl: '/images/knowledge/brazil-notill-soybean.jpg',
    imageSource: 'Wikimedia Commons (File:Soybeans no-till.jpg)',
    imageLicense: 'CC BY-SA 3.0',
    imageAttribution: 'Uaequals42 (Direct planting / no-till field of soybeans ready for harvest in Brazil)',
    tags: ['No-Tillage', 'Cover Crops', 'Crop Rotation', 'Soil Carbon', 'Cerrado Agriculture'],
    views: 0,
    likes: 0,
    likedByUsers: [] as string[],
  },
  {
    practiceId: 'prc-03',
    title: 'No-Till Winter Wheat and Soil Conservation',
    country: 'Russia' as const,
    region: 'Southern Russia / Western Siberia',
    crop: 'Winter wheat / spring wheat',
    climateZone: 'Continental Steppe',
    practiceType: 'Conservation tillage / no-till',
    description:
      'Research in southern Russia and Western Siberia has examined no-till and reduced-tillage systems for wheat production, soil moisture conservation and soil fertility.',
    practiceDetails:
      'Research in Southern Russia and Western Siberia investigates minimal soil disturbance and standing crop stubble retention in continental wheat farming. Standing residue traps winter snowpack, significantly improving early-spring root-zone moisture under dryland conditions. Field studies on chernozem and chestnut soils assess enzymatic activity, soil nitrogen dynamics, and carbon accumulation under reduced tillage. Crucially, Russian agronomic evaluations demonstrate that no-till is not universally superior across all environments: grain yield and soil biological responses depend heavily on seasonal moisture distribution, seeding depth, soil compaction, and weed competition.',
    evidenceType: 'Peer-Reviewed Research' as const,
    sourceOrganization: 'Indian Journal of Ecology',
    sourceTitle: 'Effect of conservation tillage on soil quality of Southern Russia',
    sourceYear: 2021,
    sourceUrl: 'https://indianjournals.com/api/article-view/ije1-47-3-012',
    researchEvidence: [
      "Peer-reviewed research by Kamil' Sh. Kazeev, Tatiana V. Minnikova, Gregory V. Mokrikov, and Sergey I. Kolesnikov (2020/2021) investigating conservation tillage impacts on soil biological quality in Southern Russia.",
      'Complementary Western Siberia agronomical research on the impact of tillage methods, seeding rates, and seeding depth on soil moisture and dryland spring wheat yield.',
    ],
    expectedBenefit:
      'Reduces wind and water erosion risks and conserves moisture under semi-arid continental steppe conditions, with performance dependent on seasonal weather and management.',
    adaptationNotes:
      'Potentially adaptable where local soil, climate, water availability and farming systems are suitable; performance depends on soil compaction, weed spectrum, and local moisture patterns.',
    bricsRelevance:
      'Russian research on reduced tillage and wheat systems contributes evidence on moisture conservation in dryland cereal production.',
    provenance: {
      sourceType: 'Peer-Reviewed Research',
      organization: 'Indian Journal of Ecology (Kazeev et al.)',
      title: 'Effect of conservation tillage on soil quality of Southern Russia',
      year: 2021,
      url: 'https://indianjournals.com/api/article-view/ije1-47-3-012',
      retrievedAt: '2026-09-29T09:00:00Z',
    },
    imageUrl: '/images/knowledge/russia-wheat-siberia.jpg',
    imageSource: 'Wikimedia Commons (File:Wheat_Tomsk.jpg)',
    imageLicense: 'CC BY-SA 3.0',
    imageAttribution: 'Afonin (Spring wheat cultivation in Western Siberia, Tomsk Oblast)',
    tags: ['Conservation Tillage', 'No-Till', 'Wheat Production', 'Soil Moisture', 'Steppe Agriculture'],
    views: 0,
    likes: 0,
    likedByUsers: [] as string[],
  },
  {
    practiceId: 'prc-04',
    title: 'Hani Rice Terraces and Integrated Water Management',
    country: 'China' as const,
    region: 'Yunnan Province, Honghe Hani and Yi Autonomous Prefecture',
    crop: 'Rice',
    climateZone: 'Subtropical Mountain / Highland',
    practiceType: 'Terraced agriculture / traditional water management',
    description:
      'The Hani Rice Terraces are a FAO Globally Important Agricultural Heritage System in Yunnan. The system integrates forests, villages, terraces and rivers with traditional water-management practices.',
    practiceDetails:
      'Covering approximately 70,000 hectares with over 1,300 years of documented history, the Hani Rice Terraces represent an integrated four-fold agro-ecosystem: hilltop catchment forests, middle-slope villages, terraced paddies, and lower river valleys. Hilltop forests capture rainfall and cloud mists, functioning as natural reservoirs that release water steadily into gravity-fed irrigation canals. Ingenious traditional wooden and stone water-dividers equitably allocate flow between family terraces. Continuously flooded paddies prevent hillside erosion, trap nutrient-laden silt, and sustain rich agro-biodiversity including local red rice landraces, fish, ducks, and aquatic fauna.',
    evidenceType: 'FAO GIAHS' as const,
    sourceOrganization: 'FAO GIAHS',
    sourceTitle: 'Hani Rice Terraces, China',
    sourceYear: 2010,
    sourceUrl: 'https://www.fao.org/giahs/giahs-around-the-world/china-hani-rice-terraces/en',
    researchEvidence: [
      'FAO Globally Important Agricultural Heritage Systems (GIAHS) official designation (2010) documenting the 1,300-year-old four-tiered agro-ecological ecosystem (Forests-Villages-Terraces-Rivers) across ~70,000 ha in Yunnan.',
      'Verified ecological functions: forest sponge water retention, gravity ditch networks, erosion control, and agro-biodiversity preservation.',
    ],
    expectedBenefit:
      'Eliminates hillside erosion, sustains water flow year-round via natural forest sponges and gravity channels, and preserves indigenous rice agro-biodiversity.',
    adaptationNotes:
      'Potentially adaptable where local soil, climate, water availability and farming systems are suitable; structural principles of community water distribution and mountain forest catchment protection are relevant to steep-slope watershed management.',
    bricsRelevance:
      "China's terrace and water-management knowledge can contribute to cross-country discussion on soil and water conservation in hilly farming systems.",
    provenance: {
      sourceType: 'FAO GIAHS',
      organization: 'FAO Globally Important Agricultural Heritage Systems (GIAHS)',
      title: 'Hani Rice Terraces, China',
      year: 2010,
      url: 'https://www.fao.org/giahs/giahs-around-the-world/china-hani-rice-terraces/en',
      retrievedAt: '2026-09-29T09:00:00Z',
    },
    imageUrl: '/images/knowledge/china-hani-terraces.jpg',
    imageSource: 'Wikimedia Commons (File:Terrace field yunnan china denoised.jpg)',
    imageLicense: 'CC BY-SA 3.0',
    imageAttribution: 'Jialiang Gao, www.peace-on-earth.org (Honghe Hani Rice Terraces, Yuanyang County, Yunnan)',
    tags: ['GIAHS', 'Rice Terraces', 'Water Management', 'Agrobiodiversity', 'Watershed Ecology'],
    views: 0,
    likes: 0,
    likedByUsers: [] as string[],
  },
  {
    practiceId: 'prc-05',
    title: 'Rotational Grazing for Rangeland Management',
    country: 'South Africa' as const,
    region: 'South African rangelands',
    crop: 'Livestock / pasture',
    climateZone: 'Semi-Arid Savanna / Veld',
    practiceType: 'Rotational grazing / rangeland management',
    description:
      'Rotational grazing divides grazing areas into paddocks and moves livestock between them to provide recovery periods for pasture.',
    practiceDetails:
      'The practice divides extensive rangeland into multiple distinct paddocks, rotating livestock systematically to control grazing frequency and grazing intensity. By preventing animals from continually re-grazing palatable young grass shoots, rotational grazing affords ungrazed paddocks vital rest periods to regenerate root depth and replenish carbohydrate reserves. South African agricultural guidance emphasizes that rotational grazing must be paired with strict adherence to veld carrying capacity; it does not automatically increase herd stocking density, but rather prevents chronic overgrazing and maintains ground cover resilience during drought and El Niño weather patterns.',
    evidenceType: 'FAO' as const,
    sourceOrganization: 'FAO',
    sourceTitle: 'Rotational Grazing - South Africa',
    sourceYear: 2010,
    sourceUrl: 'https://www.fao.org/4/i1861e/i1861e.pdf',
    researchEvidence: [
      "FAO case study 'Rotational Grazing - South Africa' (Grassland and Pasture Crops Group).",
      'South African Government agricultural advisory guidelines on drought and El Niño conditions recommending rotational grazing and adherence to veld carrying capacity (gov.za, 2026).',
    ],
    expectedBenefit:
      'Maintains perennial grass cover, mitigates veld degradation, and preserves pasture root reserves during dry conditions when stocking rates are kept within ecological carrying capacity.',
    adaptationNotes:
      'Potentially adaptable where local soil, climate, water availability and farming systems are suitable; requires careful paddock planning, water point distribution, and flexible stocking adjustments to match variable seasonal rainfall.',
    bricsRelevance:
      'South African rotational-grazing experience contributes knowledge on rangeland management and livestock resilience.',
    provenance: {
      sourceType: 'FAO',
      organization: 'Food and Agriculture Organization (FAO) & South African Department of Agriculture',
      title: 'Rotational Grazing - South Africa',
      year: 2010,
      url: 'https://www.fao.org/4/i1861e/i1861e.pdf',
      retrievedAt: '2026-09-29T09:00:00Z',
    },
    imageUrl: '/images/knowledge/south-africa-rotational-grazing.jpg',
    imageSource: 'Wikimedia Commons (File:Nguni cattle.jpg)',
    imageLicense: 'CC BY-SA 3.0',
    imageAttribution: 'Justinjerez (Nguni cattle herd grazing on South African sweetveld pasture)',
    tags: ['Rotational Grazing', 'Rangeland Management', 'Livestock Pasture', 'Drought Resilience', 'Veld Conservation'],
    views: 0,
    likes: 0,
    likedByUsers: [] as string[],
  },
];

export class KnowledgeService {
  private static isSeeded = false;

  /**
   * Seed / update the initial 5 verified BRICS research practices.
   */
  public static async ensureSeeded(): Promise<void> {
    if (!isConnectedToDb || this.isSeeded) return;
    try {
      for (const practice of INITIAL_BRICS_PRACTICES) {
        await KnowledgePracticeModel.findOneAndUpdate(
          { practiceId: practice.practiceId },
          {
            $set: {
              title: practice.title,
              country: practice.country,
              region: practice.region,
              crop: practice.crop,
              climateZone: practice.climateZone,
              practiceType: practice.practiceType,
              description: practice.description,
              practiceDetails: practice.practiceDetails,
              evidenceType: practice.evidenceType,
              sourceOrganization: practice.sourceOrganization,
              sourceTitle: practice.sourceTitle,
              sourceYear: practice.sourceYear,
              sourceUrl: practice.sourceUrl,
              researchEvidence: practice.researchEvidence,
              expectedBenefit: practice.expectedBenefit,
              adaptationNotes: practice.adaptationNotes,
              bricsRelevance: practice.bricsRelevance,
              provenance: practice.provenance,
              imageUrl: practice.imageUrl,
              imageSource: practice.imageSource,
              imageLicense: practice.imageLicense,
              imageAttribution: practice.imageAttribution,
              tags: practice.tags,
            },
            $setOnInsert: {
              views: 0,
              likes: 0,
              likedByUsers: [],
            },
          },
          { upsert: true, new: true }
        );
      }
      this.isSeeded = true;
      console.log('✅ KnowledgeService: Seeded & verified 5 BRICS research agricultural practices.');
    } catch (err) {
      console.error('KnowledgeService ensureSeeded error:', err);
    }
  }

  /**
   * Get all practices, optionally filtered by country.
   */
  public static async getPractices(country?: string): Promise<IKnowledgePractice[]> {
    await this.ensureSeeded();

    if (!isConnectedToDb) {
      // Dev memory fallback
      if (country && country !== 'All') {
        return INITIAL_BRICS_PRACTICES.filter((p) => p.country === country) as any;
      }
      return INITIAL_BRICS_PRACTICES as any;
    }

    const filter: any = {};
    if (country && country !== 'All') {
      filter.country = country;
    }

    return KnowledgePracticeModel.find(filter).sort({ practiceId: 1 });
  }

  /**
   * Like a practice by ID.
   * If userId is provided, prevent duplicate likes from the same user.
   */
  public static async likePractice(
    practiceId: string,
    userId?: string
  ): Promise<{ success: boolean; likes: number; alreadyLiked: boolean }> {
    if (!isConnectedToDb) {
      const p = INITIAL_BRICS_PRACTICES.find((item) => item.practiceId === practiceId);
      if (p) {
        p.likes += 1;
        return { success: true, likes: p.likes, alreadyLiked: false };
      }
      return { success: false, likes: 0, alreadyLiked: false };
    }

    const practice = await KnowledgePracticeModel.findOne({ practiceId });
    if (!practice) {
      return { success: false, likes: 0, alreadyLiked: false };
    }

    if (userId && practice.likedByUsers.includes(userId)) {
      return { success: true, likes: practice.likes, alreadyLiked: true };
    }

    practice.likes += 1;
    if (userId) {
      practice.likedByUsers.push(userId);
    }
    await practice.save();

    return { success: true, likes: practice.likes, alreadyLiked: false };
  }
}
