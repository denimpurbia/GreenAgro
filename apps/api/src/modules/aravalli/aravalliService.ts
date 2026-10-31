import { LandCoverChangeModel } from '../../models/LandCoverChange';
import { FireEventModel } from '../../models/FireEvent';
import { DISTRICTS } from '../geo/districtRegistry';
import { config } from '../../config';

function findNearestDistrict(lat: number, lng: number): string {
  let nearest = DISTRICTS[0].slug;
  let minD = Infinity;
  for (const d of DISTRICTS) {
    const dist = Math.hypot(lat - d.centroid.lat, lng - d.centroid.lng);
    if (dist < minD) {
      minD = dist;
      nearest = d.slug;
    }
  }
  return nearest;
}

export class AravalliService {
  private static purgedLegacySeeded = false;
  private static lastFirmsFetchMs = 0;

  /**
   * Purge any previously seeded synthetic records from earlier builds.
   */
  public static async cleanupLegacySeeded(): Promise<void> {
    if (this.purgedLegacySeeded) return;
    try {
      await LandCoverChangeModel.deleteMany({ sourceType: 'modelled' });
      await FireEventModel.deleteMany({
        $or: [
          { frp: 8.4, brightness: 328.5 },
          { frp: 14.2, brightness: 341.2 },
        ],
      });
      this.purgedLegacySeeded = true;
    } catch (err) {
      console.warn('[AravalliService] Cleanup notice:', err);
    }
  }

  /**
   * If FIRMS_MAP_KEY is configured, fetch live VIIRS thermal anomalies from NASA FIRMS
   * for the Southern Rajasthan Aravalli bounding box (72.8,23.2,75.2,25.6).
   */
  public static async syncLiveFirmsIfConfigured(): Promise<void> {
    const mapKey = config.firmsMapKey;
    if (!mapKey) return;

    // Rate limit live FIRMS fetch to once every 15 minutes
    if (Date.now() - this.lastFirmsFetchMs < 15 * 60 * 1000) return;
    this.lastFirmsFetchMs = Date.now();

    try {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/72.8,23.2,75.2,25.6/2`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) return;
      const csvText = await resp.text();
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h: string) => h.trim());
      const latIdx = headers.indexOf('latitude');
      const lngIdx = headers.indexOf('longitude');
      const brightIdx = headers.indexOf('bright_ti4');
      const dateIdx = headers.indexOf('acq_date');
      const confIdx = headers.indexOf('confidence');
      const frpIdx = headers.indexOf('frp');

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const lat = parseFloat(cols[latIdx]);
        const lng = parseFloat(cols[lngIdx]);
        if (!isFinite(lat) || !isFinite(lng)) continue;

        const acqDate = cols[dateIdx]?.trim() || new Date().toISOString().slice(0, 10);
        const frp = parseFloat(cols[frpIdx]) || 0;
        const brightness = parseFloat(cols[brightIdx]) || 300;
        const rawConf = (cols[confIdx] || 'nominal').trim().toLowerCase();
        const confidence: 'low' | 'nominal' | 'high' =
          rawConf === 'h' || rawConf === 'high'
            ? 'high'
            : rawConf === 'l' || rawConf === 'low'
              ? 'low'
              : 'nominal';

        const district = findNearestDistrict(lat, lng);

        await FireEventModel.updateOne(
          {
            acqDate,
            'location.coordinates': [lng, lat],
          },
          {
            $set: {
              location: { type: 'Point', coordinates: [lng, lat] },
              district,
              detectedAt: new Date(acqDate),
              satellite: 'VIIRS',
              confidence,
              frp,
              brightness,
              acqDate,
              source: 'NASA FIRMS',
              dataset: 'VIIRS_SNPP_NRT',
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('[AravalliService] Live NASA FIRMS sync warning:', (err as any)?.message);
    }
  }

  public static async getSummary(): Promise<any> {
    await this.cleanupLegacySeeded();
    await this.syncLiveFirmsIfConfigured();

    const firmsConfigured = Boolean(config.firmsMapKey);
    const eeConfigured = config.satelliteProvider === 'earth-engine';

    const changes = await LandCoverChangeModel.find({
      sourceType: { $ne: 'modelled' },
    }).lean();

    const firesLast30Days = await FireEventModel.find({
      detectedAt: { $gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
    })
      .sort({ detectedAt: -1 })
      .lean();

    const firesLast7Days = firesLast30Days.filter(
      (f) => new Date(f.detectedAt).getTime() >= Date.now() - 7 * 24 * 3600 * 1000
    );

    const hasLandCoverData = changes.length > 0;
    const hasFireData = firmsConfigured || firesLast30Days.length > 0;

    // District-wise grouping
    const districtStats = DISTRICTS.map((d) => {
      const distChanges = changes.filter((c) => c.district === d.slug);
      const distFires = firesLast30Days.filter((f) => f.district === d.slug);
      const totalDisturbedHa =
        distChanges.length > 0
          ? distChanges.reduce((sum, c) => sum + (c.areaHa || 0), 0)
          : null;

      return {
        district: d.slug,
        nameEn: d.nameEn,
        nameHi: d.nameHi,
        disturbedHa: totalDisturbedHa,
        fires30d: hasFireData ? distFires.length : null,
        vegetationHealthScore:
          totalDisturbedHa !== null ? Math.max(40, Math.round(85 - totalDisturbedHa)) : null,
      };
    });

    const totalDisturbedHa = hasLandCoverData
      ? changes.reduce((sum, c) => sum + (c.areaHa || 0), 0)
      : null;

    const overallAravalliScore =
      totalDisturbedHa !== null
        ? Math.max(45, Math.min(95, Math.round(82 - totalDisturbedHa * 0.1)))
        : null;

    return {
      score: overallAravalliScore,
      disturbedAreaHa: totalDisturbedHa,
      fireAlerts7d: hasFireData ? firesLast7Days.length : null,
      fireAlerts30d: hasFireData ? firesLast30Days.length : null,
      recentFires: firesLast30Days.slice(0, 10),
      districtStats,
      landCoverStatus: hasLandCoverData
        ? 'available'
        : eeConfigured
          ? 'no_data_yet'
          : 'configuration_required',
      firmsStatus: hasFireData ? 'available' : 'configuration_required',
      providerNotes: {
        landCover: hasLandCoverData
          ? 'Observed via Google Dynamic World / Hansen Global Forest Change.'
          : 'Configure EARTH_ENGINE_PROJECT and EARTH_ENGINE_CREDENTIALS_JSON to enable Dynamic World & Hansen forest change detection.',
        firms: hasFireData
          ? 'Observed via NASA FIRMS VIIRS_SNPP_NRT.'
          : 'Set FIRMS_MAP_KEY in apps/api/.env to enable live NASA FIRMS VIIRS thermal fire detections.',
      },
      disclaimer:
        'Possible disturbance detections require field verification. Satellite thermal anomalies indicate agricultural burning or forest fires.',
      disclaimerHi:
        'संभावित भूमि परिवर्तन की पुष्टि के लिए जमीनी सत्यापन आवश्यक है। थर्मल अलर्ट फसल अवशेष या वन अग्नि संकेत हैं।',
    };
  }
}
