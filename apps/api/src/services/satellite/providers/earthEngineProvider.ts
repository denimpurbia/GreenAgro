import fs from 'node:fs';
import path from 'node:path';
import ee from '@google/earthengine';

import {
  ISatelliteProvider,
  SatelliteResponse,
  SatelliteTrendPoint,
} from '../satelliteProvider';

type CachedSatelliteResult = {
  expiresAt: number;
  result: SatelliteResponse;
};

export class EarthEngineSatelliteProvider
  implements ISatelliteProvider
{
  public name = 'earth-engine';

  private static initialized = false;
  private static initPromise: Promise<void> | null = null;

  /*
   * ============================================================
   * REAL DATA CACHE
   * ============================================================
   *
   * We cache only successful REAL Google Earth Engine results.
   *
   * First request:
   *   Browser -> API -> Google Earth Engine
   *
   * Next requests within 10 minutes:
   *   Browser -> API -> memory cache
   *
   * No fake/mock values are generated.
   */
  private static readonly CACHE_TTL_MS =
    10 * 60 * 1000;

  private static readonly resultCache =
    new Map<string, CachedSatelliteResult>();

  /*
   * Prevent multiple identical requests from hitting
   * Google Earth Engine at the same time.
   */
  private static readonly pendingRequests =
    new Map<string, Promise<SatelliteResponse>>();

  /*
   * ============================================================
   * CONFIGURATION
   * ============================================================
   */

  public isConfigured(): boolean {
    const project =
      process.env.EARTH_ENGINE_PROJECT || '';

    const credentials =
      process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

    return Boolean(
      project.trim() &&
        credentials.trim()
    );
  }

  /*
   * ============================================================
   * CACHE KEY
   * ============================================================
   */

  private getCacheKey(
    lat: number,
    lon: number
  ): string {
    return `${lat.toFixed(6)},${lon.toFixed(6)}`;
  }

  /*
   * ============================================================
   * EARTH ENGINE INITIALIZATION
   * ============================================================
   */

  private async initialize(): Promise<void> {
    if (
      EarthEngineSatelliteProvider.initialized
    ) {
      return;
    }

    if (
      EarthEngineSatelliteProvider.initPromise
    ) {
      return EarthEngineSatelliteProvider.initPromise;
    }

    const project =
      process.env.EARTH_ENGINE_PROJECT || '';

    const credentialsPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      '';

    if (
      !project.trim() ||
      !credentialsPath.trim()
    ) {
      throw new Error(
        'Earth Engine configuration is missing. Please check EARTH_ENGINE_PROJECT and GOOGLE_APPLICATION_CREDENTIALS.'
      );
    }

    const candidatePaths = [
      path.resolve(
        process.cwd(),
        credentialsPath
      ),

      path.resolve(
        process.cwd(),
        'apps/api',
        credentialsPath
      ),

      path.resolve(
        __dirname,
        '../../../../',
        credentialsPath
      ),

      path.resolve(
        __dirname,
        '../../../',
        credentialsPath
      ),

      path.resolve(
        __dirname,
        '../../',
        credentialsPath
      ),
    ];

    let resolvedCredentialsPath =
      '';

    for (
      const candidate of candidatePaths
    ) {
      if (
        fs.existsSync(candidate)
      ) {
        resolvedCredentialsPath =
          candidate;

        break;
      }
    }

    if (
      !resolvedCredentialsPath
    ) {
      throw new Error(
        `Earth Engine credentials file not found. Checked: ${candidatePaths.join(
          ', '
        )}`
      );
    }

    const privateKey =
      JSON.parse(
        fs.readFileSync(
          resolvedCredentialsPath,
          'utf8'
        )
      );

    EarthEngineSatelliteProvider.initPromise =
      new Promise<void>(
        (
          resolve,
          reject
        ) => {
          ee.data.authenticateViaPrivateKey(
            privateKey,

            () => {
              ee.initialize(
                null,
                null,

                () => {
                  EarthEngineSatelliteProvider.initialized =
                    true;

                  console.log(
                    '[Satellite] Google Earth Engine initialized successfully.'
                  );

                  resolve();
                },

                (
                  error: unknown
                ) => {
                  EarthEngineSatelliteProvider.initPromise =
                    null;

                  reject(error);
                },

                null,

                project
              );
            },

            (
              error: unknown
            ) => {
              EarthEngineSatelliteProvider.initPromise =
                null;

              reject(error);
            }
          );
        }
      );

    return EarthEngineSatelliteProvider.initPromise;
  }

  /*
   * ============================================================
   * MAIN NDVI METHOD
   * ============================================================
   */

  public async fetchNDVI(
    lat: number,
    lon: number
  ): Promise<SatelliteResponse> {
    const numericLat =
      Number(lat);

    const numericLon =
      Number(lon);

    /*
     * ----------------------------------------------------------
     * Coordinate validation
     * ----------------------------------------------------------
     */

    if (
      !Number.isFinite(
        numericLat
      ) ||
      !Number.isFinite(
        numericLon
      ) ||
      numericLat < -90 ||
      numericLat > 90 ||
      numericLon < -180 ||
      numericLon > 180
    ) {
      return {
        status: 'error',

        message:
          'Invalid latitude or longitude.',

        code:
          'INVALID_COORDINATES',
      };
    }

    /*
     * ----------------------------------------------------------
     * Provider configuration
     * ----------------------------------------------------------
     */

    if (!this.isConfigured()) {
      return {
        status:
          'not_configured',

        message:
          'Google Earth Engine is selected as the satellite provider, but credentials are incomplete in .env.',

        configurationRequired: [
          'Ensure EARTH_ENGINE_PROJECT is set.',

          'Ensure GOOGLE_APPLICATION_CREDENTIALS points to the service account JSON file.',
        ],
      };
    }

    const cacheKey =
      this.getCacheKey(
        numericLat,
        numericLon
      );

    /*
     * ----------------------------------------------------------
     * CACHE HIT
     * ----------------------------------------------------------
     */

    const cached =
      EarthEngineSatelliteProvider.resultCache.get(
        cacheKey
      );

    if (
      cached &&
      cached.expiresAt >
        Date.now()
    ) {
      console.log(
        `[Satellite] Cache HIT: ${cacheKey}`
      );

      return cached.result;
    }

    if (cached) {
      EarthEngineSatelliteProvider.resultCache.delete(
        cacheKey
      );
    }

    /*
     * ----------------------------------------------------------
     * DUPLICATE REQUEST PROTECTION
     * ----------------------------------------------------------
     *
     * If the same location is requested twice before the first
     * Earth Engine request finishes, both callers use the same
     * Promise.
     */

    const pending =
      EarthEngineSatelliteProvider.pendingRequests.get(
        cacheKey
      );

    if (pending) {
      console.log(
        `[Satellite] Request already running: ${cacheKey}`
      );

      return pending;
    }

    const requestPromise =
      this.fetchFreshNDVI(
        numericLat,
        numericLon,
        cacheKey
      );

    EarthEngineSatelliteProvider.pendingRequests.set(
      cacheKey,
      requestPromise
    );

    try {
      return await requestPromise;
    } finally {
      EarthEngineSatelliteProvider.pendingRequests.delete(
        cacheKey
      );
    }
  }

  /*
   * ============================================================
   * FRESH EARTH ENGINE REQUEST
   * ============================================================
   */

  private async fetchFreshNDVI(
    lat: number,
    lon: number,
    cacheKey: string
  ): Promise<SatelliteResponse> {
    try {
      /*
       * Initialize Google Earth Engine.
       */
      await this.initialize();

      console.log(
        `[Satellite] Fetching REAL NDVI for coordinates: ${lat}, ${lon}`
      );

      const point =
        ee.Geometry.Point([
          lon,
          lat,
        ]);

      /*
       * ========================================================
       * DATE WINDOWS
       * ========================================================
       *
       * We use a wider period than the old 60-day window.
       *
       * This greatly reduces the chance of getting an empty
       * collection because of cloud filtering.
       */

      const endDate =
        new Date();

      const startDate =
        new Date();

      startDate.setDate(
        startDate.getDate() - 180
      );

      const formatDate = (
        date: Date
      ): string =>
        date
          .toISOString()
          .split('T')[0];

      /*
       * ========================================================
       * SENTINEL-2 COLLECTION
       * ========================================================
       */

      const collection =
        ee
          .ImageCollection(
            'COPERNICUS/S2_SR_HARMONIZED'
          )
          .filterBounds(
            point
          )
          .filterDate(
            formatDate(
              startDate
            ),
            formatDate(
              endDate
            )
          )
          .filter(
            ee.Filter.lt(
              'CLOUDY_PIXEL_PERCENTAGE',
              60
            )
          );

      /*
       * IMPORTANT:
       *
       * We check collection.size() BEFORE attempting to access
       * B4/B8 from an image.
       *
       * This prevents:
       *
       * "No band named B8"
       *
       * when Earth Engine returns an empty collection.
       */

      const collectionSize =
        await this.getInfo<number>(
          collection.size()
        );

      console.log(
        `[Satellite] Sentinel-2 images found: ${collectionSize}`
      );

      /*
       * --------------------------------------------------------
       * If 180 days with <=60% clouds has no image,
       * try a wider 365-day / 80% cloud window.
       *
       * Still REAL satellite data.
       * No mock values.
       * --------------------------------------------------------
       */

      let usableCollection =
        collection;

      if (
        !Number.isFinite(
          Number(collectionSize)
        ) ||
        Number(collectionSize) <= 0
      ) {
        console.log(
          '[Satellite] No imagery in primary window. Trying wider REAL Sentinel-2 window.'
        );

        const fallbackStartDate =
          new Date();

        fallbackStartDate.setDate(
          fallbackStartDate.getDate() -
            365
        );

        usableCollection =
          ee
            .ImageCollection(
              'COPERNICUS/S2_SR_HARMONIZED'
            )
            .filterBounds(
              point
            )
            .filterDate(
              formatDate(
                fallbackStartDate
              ),
              formatDate(
                endDate
              )
            )
            .filter(
              ee.Filter.lt(
                'CLOUDY_PIXEL_PERCENTAGE',
                80
              )
            );

        const fallbackSize =
          await this.getInfo<number>(
            usableCollection.size()
          );

        console.log(
          `[Satellite] Sentinel-2 fallback images found: ${fallbackSize}`
        );

        if (
          !Number.isFinite(
            Number(
              fallbackSize
            )
          ) ||
          Number(
            fallbackSize
          ) <= 0
        ) {
          return {
            status: 'error',

            message:
              'No Sentinel-2 satellite imagery is available for this location.',

            code:
              'NO_SATELLITE_DATA',
          };
        }
      }

      /*
       * ========================================================
       * CURRENT NDVI
       * ========================================================
       *
       * We only call normalizedDifference after confirming that
       * an image actually exists.
       */

      const latestImage =
        ee.Image(
          usableCollection
            .sort(
              'system:time_start',
              false
            )
            .first()
        );

      const ndviImage =
        latestImage
          .select([
            'B4',
            'B8',
          ])
          .normalizedDifference([
            'B8',
            'B4',
          ])
          .rename(
            'NDVI'
          );

      /*
       * One real Earth Engine reduceRegion request.
       */

      const currentResult =
        await this.getInfo<any>(
          ndviImage.reduceRegion({
            reducer:
              ee.Reducer.mean(),

            geometry:
              point,

            scale: 10,

            maxPixels:
              1e8,

            bestEffort:
              true,
          })
        );

      const ndvi =
        Number(
          currentResult?.NDVI
        );

      console.log(
        `[Satellite] REAL NDVI result: ${ndvi}`
      );

      /*
       * --------------------------------------------------------
       * Final validation
       * --------------------------------------------------------
       */

      if (
        !Number.isFinite(
          ndvi
        )
      ) {
        return {
          status: 'error',

          message:
            'Satellite imagery was found, but NDVI could not be calculated for this location.',

          code:
            'NDVI_CALCULATION_FAILED',
        };
      }

      /*
       * ========================================================
       * SIX-MONTH REAL TREND
       * ========================================================
       *
       * The entire six-month trend is calculated through ONE
       * Earth Engine reduceRegion call.
       *
       * This is much faster than doing six independent
       * reduceRegion requests.
       */

      const trendMonths =
        await this.calculateTrendFast(
          point
        );

      /*
       * ========================================================
       * FINAL REAL RESULT
       * ======================================================== */

      const result: SatelliteResponse =
        {
          status:
            'success',

          ndvi:
            Number(
              ndvi.toFixed(4)
            ),

          vegetationStatus:
            this.getVegetationStatus(
              ndvi
            ),

          trendMonths,

          explanation:
            this.getExplanation(
              ndvi
            ),

          lastUpdated:
            new Date().toISOString(),

          source:
            'Google Earth Engine',

          dataset:
            'COPERNICUS/S2_SR_HARMONIZED',

          provenance: {
            source:
              'Google Earth Engine / Sentinel-2',

            sourceType:
              'live',
          },
        };

      /*
       * ========================================================
       * CACHE ONLY SUCCESSFUL REAL RESULT
       * ======================================================== */

      EarthEngineSatelliteProvider.resultCache.set(
        cacheKey,
        {
          expiresAt:
            Date.now() +
            EarthEngineSatelliteProvider.CACHE_TTL_MS,

          result,
        }
      );

      console.log(
        `[Satellite] Fresh REAL NDVI cached: ${cacheKey} -> ${result.ndvi}`
      );

      return result;
    } catch (error: any) {
      const errMsg =
        error instanceof Error
          ? error.message
          : typeof error ===
            'string'
          ? error
          : error?.message ||
            error?.error ||
            (
              typeof error ===
              'object'
                ? JSON.stringify(
                    error
                  )
                : String(
                    error
                  )
            );

      console.error(
        '[Satellite] Earth Engine NDVI error:',
        errMsg,
        error
      );

      return {
        status: 'error',

        message:
          errMsg ||
          'Google Earth Engine NDVI request failed.',

        code:
          'GEE_NDVI_ERROR',
      };
    }
  }

  /*
   * ============================================================
   * FAST SIX-MONTH TREND
   * ============================================================
   *
   * Instead of:
   *
   * 6 months x reduceRegion()
   *
   * we create six NDVI bands and request all values together.
   *
   * Missing months are NOT converted to 0.
   * Missing months are simply omitted from the trend.
   */

  private async calculateTrendFast(
    point: any
  ): Promise<SatelliteTrendPoint[]> {
    const now =
      new Date();

    const monthlyImages: any[] = [];

    const monthNames: string[] = [];

    for (
      let index = 5;
      index >= 0;
      index--
    ) {
      const end =
        new Date(
          now.getFullYear(),
          now.getMonth() -
            index +
            1,
          0
        );

      const start =
        new Date(
          end.getFullYear(),
          end.getMonth() -
            1,
          1
        );

      const formatDate = (
        date: Date
      ): string =>
        date
          .toISOString()
          .split('T')[0];

      const monthName =
        start.toLocaleString(
          'en-US',
          {
            month:
              'short',
          }
        );

      const bandName =
        `NDVI_${index}`;

      /*
       * Use a reasonably wide monthly cloud threshold.
       *
       * This is still actual Sentinel-2 imagery.
       */

      const monthCollection =
        ee
          .ImageCollection(
            'COPERNICUS/S2_SR_HARMONIZED'
          )
          .filterBounds(
            point
          )
          .filterDate(
            formatDate(
              start
            ),
            formatDate(
              end
            )
          )
          .filter(
            ee.Filter.lt(
              'CLOUDY_PIXEL_PERCENTAGE',
              70
            )
          );

      /*
       * IMPORTANT:
       *
       * If this month's collection is empty, use a masked image.
       *
       * This is NOT a fake NDVI value.
       *
       * The masked image produces no value in reduceRegion,
       * and that month is omitted from the final trend.
       */

      const monthlyImage =
        ee.Image(
          ee.Algorithms.If(
            monthCollection
              .size()
              .gt(0),

            monthCollection
              .median()
              .select([
                'B4',
                'B8',
              ])
              .normalizedDifference([
                'B8',
                'B4',
              ])
              .rename(
                bandName
              ),

            ee.Image(
              0
            )
              .updateMask(
                ee.Image(
                  0
                )
              )
              .rename(
                bandName
              )
          )
        );

      monthlyImages.push(
        monthlyImage
      );

      monthNames.push(
        monthName
      );
    }

    /*
     * Combine all monthly images into one image.
     */

    let combined =
      monthlyImages[0];

    for (
      let i = 1;
      i <
      monthlyImages.length;
      i++
    ) {
      combined =
        combined.addBands(
          monthlyImages[i]
        );
    }

    /*
     * ONE Earth Engine request for all six months.
     */

    const trendResult =
      await this.getInfo<any>(
        combined.reduceRegion({
          reducer:
            ee.Reducer.mean(),

          geometry:
            point,

          scale: 10,

          maxPixels:
            1e8,

          bestEffort:
            true,
        })
      );

    /*
     * Convert only REAL values into trend points.
     *
     * No imagery = no point.
     * No fake zero.
     */

    const trend: SatelliteTrendPoint[] =
      [];

    for (
      let index = 5;
      index >= 0;
      index--
    ) {
      const bandName =
        `NDVI_${index}`;

      const value =
        Number(
          trendResult?.[
            bandName
          ]
        );

      if (
        Number.isFinite(
          value
        )
      ) {
        trend.push({
          month:
            monthNames[
              5 - index
            ],

          value:
            Number(
              value.toFixed(4)
            ),
        });
      }
    }

    return trend;
  }

  /*
   * ============================================================
   * VEGETATION STATUS
   * ============================================================
   */

  private getVegetationStatus(
    ndvi: number
  ): string {
    if (
      ndvi < 0
    ) {
      return (
        'Water / Non-vegetated'
      );
    }

    if (
      ndvi < 0.2
    ) {
      return (
        'Very Low Vegetation'
      );
    }

    if (
      ndvi < 0.4
    ) {
      return (
        'Low Vegetation'
      );
    }

    if (
      ndvi < 0.6
    ) {
      return (
        'Moderate Vegetation'
      );
    }

    if (
      ndvi < 0.8
    ) {
      return (
        'Healthy Vegetation'
      );
    }

    return (
      'Very Healthy Vegetation'
    );
  }

  /*
   * ============================================================
   * EXPLANATION
   * ============================================================
   */

  private getExplanation(
    ndvi: number
  ): string {
    if (
      ndvi < 0.2
    ) {
      return (
        'The satellite data indicates very limited vegetation at this location.'
      );
    }

    if (
      ndvi < 0.4
    ) {
      return (
        'The satellite data indicates low vegetation activity at this location.'
      );
    }

    if (
      ndvi < 0.6
    ) {
      return (
        'The satellite data indicates moderate vegetation activity at this location.'
      );
    }

    if (
      ndvi < 0.8
    ) {
      return (
        'The satellite data indicates healthy vegetation activity at this location.'
      );
    }

    return (
      'The satellite data indicates very healthy vegetation activity at this location.'
    );
  }

  /*
   * ============================================================
   * EARTH ENGINE getInfo WRAPPER
   * ============================================================
   */

  private getInfo<T>(
    object: any
  ): Promise<T> {
    return new Promise<T>(
      (
        resolve,
        reject
      ) => {
        object.getInfo(
          (
            value: T,
            error?: unknown
          ) => {
            if (error) {
              reject(
                error
              );
              return;
            }

            resolve(
              value
            );
          }
        );
      }
    );
  }
}