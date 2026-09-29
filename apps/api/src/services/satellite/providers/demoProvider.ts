import { ISatelliteProvider, SatelliteResponse } from '../satelliteProvider';

/**
 * DemoSatelliteProvider
 * STRICT GUARD: Never activates in production.
 * Only activates when explicitly selected in development via SATELLITE_PROVIDER=demo.
 */
export class DemoSatelliteProvider implements ISatelliteProvider {
  public name = 'demo';

  public isConfigured(): boolean {
    return process.env.NODE_ENV !== 'production' && process.env.SATELLITE_PROVIDER === 'demo';
  }

  public async fetchNDVI(_lat: number, _lon: number): Promise<SatelliteResponse> {
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'not_configured',
        message: 'Demo satellite provider is strictly forbidden in production mode.',
        configurationRequired: ['Configure a live satellite provider such as Google Earth Engine.'],
      };
    }

    return {
      status: 'not_configured',
      message: 'Satellite data is not configured yet.',
      configurationRequired: ['Set SATELLITE_PROVIDER=earth-engine and configure Earth Engine credentials.'],
    };
  }
}
