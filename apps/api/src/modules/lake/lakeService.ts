import { LakeModel } from '../../models/Lake';
import { LakeObservationModel } from '../../models/LakeObservation';
import { LAKES } from '../geo/lakeRegistry';
import { config } from '../../config';

export class LakeService {
  private static cleanedUpModelled = false;

  /**
   * Ensure the 12 Southern Rajasthan lakes from the static geographic registry
   * exist in MongoDB, and purge any previously seeded synthetic ('modelled') observations.
   */
  public static async ensureSeeded(): Promise<void> {
    try {
      // Remove any previously seeded modelled observations so only real satellite observations exist
      if (!this.cleanedUpModelled) {
        await LakeObservationModel.deleteMany({ sourceType: 'modelled' });
        this.cleanedUpModelled = true;
      }

      const count = await LakeModel.countDocuments();
      if (count >= LAKES.length) return;

      for (const item of LAKES) {
        await LakeModel.updateOne(
          { slug: item.slug },
          {
            $set: {
              slug: item.slug,
              nameEn: item.nameEn,
              nameHi: item.nameHi,
              district: item.district,
              location: {
                type: 'Point',
                coordinates: [item.lng, item.lat],
              },
              baselineAreaHa: item.baselineAreaHa,
              builtYear: item.builtYear,
              catchmentKm2: item.catchmentKm2,
              description: item.description,
              descriptionHi: item.descriptionHi,
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('[LakeService] Lake registry sync notice:', err);
    }
  }

  public static isSatelliteConfigured(): boolean {
    return config.satelliteProvider === 'earth-engine';
  }

  public static async getAllLakes(): Promise<any[]> {
    await this.ensureSeeded();
    const lakes = await LakeModel.find().lean();
    const eeConfigured = this.isSatelliteConfigured();

    const enriched = await Promise.all(
      lakes.map(async (l) => {
        const latestObs = await LakeObservationModel.findOne({
          lakeSlug: l.slug,
          sourceType: { $ne: 'modelled' },
        })
          .sort({ month: -1 })
          .lean();

        return {
          ...l,
          latestObservation: latestObs || null,
          healthScore: latestObs?.healthScore ?? null,
          observationStatus: latestObs
            ? 'available'
            : eeConfigured
              ? 'no_data_yet'
              : 'configuration_required',
          providerNote: latestObs
            ? `Observed via ${latestObs.source} (${latestObs.month})`
            : eeConfigured
              ? 'No Sentinel-2 observation ingested for this lake yet.'
              : 'Configure EARTH_ENGINE_PROJECT and EARTH_ENGINE_CREDENTIALS_JSON to enable live Sentinel-2 MNDWI/NDTI/NDCI lake observations.',
        };
      })
    );
    return enriched;
  }

  public static async getLakeBySlug(slug: string): Promise<any | null> {
    await this.ensureSeeded();
    const lake = await LakeModel.findOne({ slug }).lean();
    if (!lake) return null;

    const eeConfigured = this.isSatelliteConfigured();
    const observations = await LakeObservationModel.find({
      lakeSlug: slug,
      sourceType: { $ne: 'modelled' },
    })
      .sort({ month: 1 })
      .lean();

    const latestObs = observations.length > 0 ? observations[observations.length - 1] : null;

    return {
      lake,
      observations,
      latestObservation: latestObs,
      healthScore: latestObs?.healthScore ?? null,
      baselineAreaHa: lake.baselineAreaHa,
      observationStatus: latestObs
        ? 'available'
        : eeConfigured
          ? 'no_data_yet'
          : 'configuration_required',
      providerNote: latestObs
        ? `Observed via ${latestObs.source} (${latestObs.month})`
        : eeConfigured
          ? 'No Sentinel-2 observation ingested for this lake yet.'
          : 'Configure EARTH_ENGINE_PROJECT and EARTH_ENGINE_CREDENTIALS_JSON to enable live Sentinel-2 MNDWI/NDTI/NDCI lake observations.',
    };
  }
}
