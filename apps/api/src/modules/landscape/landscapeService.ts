import { LandscapeIndexEngine } from './landscapeIndexEngine';
import { LakeService } from '../lake/lakeService';
import { AravalliService } from '../aravalli/aravalliService';
import { WatershedService } from '../watershed/watershedService';
import { FarmModel } from '../../models/Farm';
import { FarmTerrainModel } from '../../models/FarmTerrain';
import { SoilObservationModel } from '../../models/SoilObservation';

export class LandscapeService {
  public static async getLandscapeOverview(): Promise<any> {
    // 1. Lake Health (only from lakes with real satellite observations)
    const lakes = await LakeService.getAllLakes();
    const observedLakes = lakes.filter((l) => typeof l.healthScore === 'number');
    const avgLakeHealth =
      observedLakes.length > 0
        ? Math.round(
            observedLakes.reduce((acc, l) => acc + Number(l.healthScore), 0) / observedLakes.length
          )
        : null;

    // 2. Aravalli Vegetation Score (only if real land cover data exists)
    const aravalli = await AravalliService.getSummary();
    const aravalliScore = typeof aravalli.score === 'number' ? aravalli.score : null;

    // 3. Watershed Resilience (computed from real Copernicus DEM terrain analyses in DB)
    let terrainDocs = await FarmTerrainModel.find({
      dataset: 'Copernicus DEM GLO-90 (Open-Meteo Elevation)',
    }).lean();

    if (terrainDocs.length === 0) {
      await WatershedService.getFarmTerrainAnalysis(
        'udaipur-ahar-watershed',
        'regional-watershed',
        24.5854,
        73.7125,
        'loam'
      );
      terrainDocs = await FarmTerrainModel.find({
        dataset: 'Copernicus DEM GLO-90 (Open-Meteo Elevation)',
      }).lean();
    }

    let watershedResilienceScore: number | null = null;
    if (terrainDocs.length > 0) {
      // Convert RUSLE soil loss A (t/ha/yr) into a 0-100 resilience score: 100 - min(80, A * 4)
      const avgResilience =
        terrainDocs.reduce((acc, t) => {
          const loss = Number(t.rusleA) || 0;
          const resScore = Math.max(20, Math.min(98, Math.round(100 - loss * 4)));
          return acc + resScore;
        }, 0) / terrainDocs.length;
      watershedResilienceScore = Math.round(avgResilience);
    }

    // 4. Farm Count & Regenerative Score (only included if >= 5 farms exist and have real soil observations)
    const farmCount = await FarmModel.countDocuments();
    let farmRegenerativeScore: number | null = null;
    if (farmCount >= 5) {
      const soilObs = await SoilObservationModel.find().sort({ createdAt: -1 }).limit(100).lean();
      if (soilObs.length > 0) {
        farmRegenerativeScore = Math.round(
          soilObs.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / soilObs.length
        );
      }
    }

    const index = LandscapeIndexEngine.calculate({
      aravalliVegetationScore: aravalliScore,
      watershedResilienceScore,
      lakeHealthScore: avgLakeHealth,
      farmRegenerativeScore,
      farmCount,
    });

    return {
      index,
      summary: {
        totalMonitoredLakes: lakes.length,
        observedLakesCount: observedLakes.length,
        averageLakeHealth: avgLakeHealth,
        aravalliIntegrityScore: aravalliScore,
        activeFireAlerts7d: aravalli.fireAlerts7d,
        watershedResilienceScore,
        analyzedWatershedParcelsCount: terrainDocs.length,
        contributingFarmsCount: farmCount,
        farmRegenerativeScore,
      },
      lakes: lakes.slice(0, 12).map((l) => ({
        slug: l.slug,
        nameEn: l.nameEn,
        nameHi: l.nameHi,
        district: l.district,
        healthScore: l.healthScore,
        observationStatus: l.observationStatus,
        baselineAreaHa: l.baselineAreaHa,
      })),
      corridor: {
        ridge: 'Aravalli Range (Southern Ridge)',
        slopes: 'Piedmont agricultural slopes',
        drainage: 'Berach & Gomti River Basins',
        sink: 'Udaipur & Rajsamand Lake System',
      },
      bannerQuoteEn: index.bannerQuoteEn,
      bannerQuoteHi: index.bannerQuoteHi,
    };
  }
}
